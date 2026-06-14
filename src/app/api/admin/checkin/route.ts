import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, audit } from "@/lib/adminSession";
import { verifySignature } from "@/lib/qr";
export const runtime = "nodejs";

function normaliseScanQuery(raw: string): string {
  const q = raw.trim();
  if (!q) return "";
  try {
    const u = new URL(q);
    if (u.pathname.includes("/verify/")) {
      const id = decodeURIComponent(u.pathname.split("/verify/").pop() || "").trim();
      if (id) return id;
    }
  } catch {
    // plain text scan
  }
  if (q.includes("/verify/")) {
    const id = decodeURIComponent(q.split("/verify/").pop() || "").trim();
    if (id) return id;
  }
  return q;
}

function parseDay(value: unknown): 1 | 2 {
  return value === 2 ? 2 : 1;
}

async function checkinCounts() {
  const [day1Count, day2Count, totalUnique, compTotal] = await Promise.all([
    prisma.registration.count({ where: { status: "PAID", checkedInDay1: true } }),
    prisma.registration.count({ where: { status: "PAID", checkedInDay2: true } }),
    prisma.registration.count({ where: { status: "PAID", OR: [{ checkedInDay1: true }, { checkedInDay2: true }] } }),
    prisma.competitionRegistration.count({ where: { status: "PAID", checkedIn: true } })
  ]);
  return { day1Count, day2Count, totalUnique: totalUnique + compTotal };
}

async function recentCheckins(limit = 20) {
  const logs = await prisma.adminAction.findMany({
    where: {
      action: { startsWith: "checkin" },
      entity: { in: ["Registration", "CompetitionRegistration"] },
      entityId: { not: null }
    },
    orderBy: { createdAt: "desc" },
    take: limit
  });

  const regIds = Array.from(new Set(
    logs.filter((l) => l.entity === "Registration").map((l) => l.entityId).filter(Boolean)
  )) as string[];
  const compIds = Array.from(new Set(
    logs.filter((l) => l.entity === "CompetitionRegistration").map((l) => l.entityId).filter(Boolean)
  )) as string[];

  const [regs, comps] = await Promise.all([
    regIds.length
      ? prisma.registration.findMany({
          where: { id: { in: regIds } },
          select: { id: true, delegateId: true, fullName: true, trackName: true, portfolio: true }
        })
      : Promise.resolve([]),
    compIds.length
      ? prisma.competitionRegistration.findMany({
          where: { id: { in: compIds } },
          select: { id: true, refId: true, leaderName: true, competitionTitle: true }
        })
      : Promise.resolve([])
  ]);

  const regMap = new Map(regs.map((r) => [r.id, r]));
  const compMap = new Map(
    comps.map((c) => [c.id, { id: c.id, delegateId: c.refId, fullName: c.leaderName, trackName: c.competitionTitle, portfolio: null }])
  );

  return logs.map((l) => {
    const reg = l.entity === "CompetitionRegistration"
      ? (l.entityId ? compMap.get(l.entityId) : null)
      : (l.entityId ? regMap.get(l.entityId) : null);
    return { id: l.id, scannedAt: l.createdAt, action: l.action, adminEmail: l.adminEmail, meta: l.meta, registration: reg || null };
  });
}

export async function GET(req: NextRequest) {
  const q = normaliseScanQuery(req.nextUrl.searchParams.get("q")?.trim() || "");
  let results: any[] = [];
  if (q) {
    const [regs, comps] = await Promise.all([
      prisma.registration.findMany({
        where: { OR: [{ delegateId: q }, { email: { contains: q, mode: "insensitive" } }], status: "PAID" },
        select: { id: true, delegateId: true, fullName: true, trackName: true, checkedInDay1: true, checkedInDay2: true },
        take: 10
      }),
      prisma.competitionRegistration.findMany({
        where: { OR: [{ refId: q }, { email: { contains: q, mode: "insensitive" } }], status: "PAID" },
        select: { id: true, refId: true, leaderName: true, competitionTitle: true, checkedIn: true, checkedInAt: true },
        take: 10
      })
    ]);
    results = [
      ...regs,
      ...comps.map((c) => ({
        id: c.id,
        delegateId: c.refId,
        fullName: c.leaderName,
        trackName: c.competitionTitle,
        checkedInDay1: c.checkedIn,
        checkedInDay2: false,
        isCompetition: true
      }))
    ];
  }
  const counts = await checkinCounts();
  const recent = await recentCheckins();
  return NextResponse.json({ results, ...counts, recent });
}

export async function POST(req: NextRequest) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => null);
  const day = parseDay(b?.day);
  let id = typeof b?.id === "string" ? b.id : "";
  const scanQ = typeof b?.q === "string" ? normaliseScanQuery(b.q) : "";

  if (!id && !scanQ) return NextResponse.json({ error: "Bad request" }, { status: 422 });

  let target: any = null;
  let isCompetition = false;

  if (!id && scanQ) {
    const sigDot = scanQ.lastIndexOf(".");

    if (scanQ.startsWith("NDGYS-C-")) {
      // Competition QR
      const competitionRef = sigDot > 0 ? scanQ.substring(0, sigDot) : scanQ;
      target = await prisma.competitionRegistration.findFirst({
        where: { refId: competitionRef, status: "PAID" }
      });
      isCompetition = true;
    } else if (sigDot > 0) {
      // Signed MUN QR
      const dId = scanQ.slice(0, sigDot);
      const sig = scanQ.slice(sigDot + 1);
      if (!verifySignature(dId, sig)) return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      target = await prisma.registration.findFirst({ where: { status: "PAID", delegateId: dId } });
    } else {
      // Manual MUN lookup by ID or email
      target = await prisma.registration.findFirst({
        where: { status: "PAID", OR: [{ delegateId: scanQ }, { email: { contains: scanQ, mode: "insensitive" } }] }
      });
    }
  } else if (id) {
    target = await prisma.registration.findUnique({ where: { id } });
    if (!target) {
      target = await prisma.competitionRegistration.findUnique({ where: { id } });
      if (target) isCompetition = true;
    }
  }

  if (!target || target.status !== "PAID") {
    return NextResponse.json({ error: "No paid participant found." }, { status: 404 });
  }

  id = target.id;

  // Competition check-in (single boolean, no day tracking)
  if (isCompetition) {
    if (target.checkedIn) {
      return NextResponse.json({ ok: true, alreadyCheckedIn: true, when: target.checkedInAt?.toISOString() ?? null });
    }
    const updated = await prisma.competitionRegistration.update({
      where: { id },
      data: { checkedIn: true, checkedInAt: new Date() }
    });
    await audit(admin.email, "competition.checkin.scan", "CompetitionRegistration", id, `refId=${updated.refId}`);
    const counts = await checkinCounts();
    const recent = await recentCheckins();
    return NextResponse.json({ ok: true, competition: true, registration: updated, ...counts, recent });
  }

  // MUN Day 1 / Day 2 check-in
  const value = b?.value === undefined ? true : !!b.value;
  const already = day === 1 ? !!target.checkedInDay1 : !!target.checkedInDay2;
  if (value === true && already) {
    const existing = await prisma.adminAction.findFirst({
      where: { entity: "Registration", entityId: id, action: { startsWith: "checkin" }, meta: { contains: `day${day}=true` } },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ ok: true, alreadyCheckedIn: true, when: existing?.createdAt.toISOString() ?? null });
  }

  const data = day === 1 ? { checkedInDay1: value } : { checkedInDay2: value };
  const reg = await prisma.registration.update({ where: { id }, data });
  await audit(admin.email, b?.q ? "checkin.scan" : "checkin.manual", "Registration", id, `day${day}=${value};q=${scanQ || ""}`);

  const counts = await checkinCounts();
  const recent = await recentCheckins();
  return NextResponse.json({ ok: true, registration: { id: reg.id, checkedInDay1: reg.checkedInDay1, checkedInDay2: reg.checkedInDay2 }, ...counts, recent });
}
