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
    // plain text scan, keep original hand
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
  const [day1Count, day2Count, totalUnique] = await Promise.all([
    prisma.registration.count({ where: { status: "PAID", checkedInDay1: true } }),
    prisma.registration.count({ where: { status: "PAID", checkedInDay2: true } }),
    prisma.registration.count({ where: { status: "PAID", OR: [{ checkedInDay1: true }, { checkedInDay2: true }] } })
  ]);
  return { day1Count, day2Count, totalUnique };
}

async function recentCheckins(limit = 20) {
  const logs = await prisma.adminAction.findMany({
    where: { action: { startsWith: "checkin" }, entity: "Registration", entityId: { not: null } },
    orderBy: { createdAt: "desc" },
    take: limit
  });
  const ids = Array.from(new Set(logs.map((l) => l.entityId).filter(Boolean))) as string[];
  const regs = ids.length
    ? await prisma.registration.findMany({
        where: { id: { in: ids } },
        select: { id: true, delegateId: true, fullName: true, trackName: true, portfolio: true }
      })
    : [];
  const map = new Map(regs.map((r) => [r.id, r]));
  return logs.map((l) => {
    const reg = l.entityId ? map.get(l.entityId) : null;
    return {
      id: l.id,
      scannedAt: l.createdAt,
      action: l.action,
      adminEmail: l.adminEmail,
      meta: l.meta,
      registration: reg || null
    };
  });
}

// lookup by ?q=delegateId|email
export async function GET(req: NextRequest) {
  const q = normaliseScanQuery(req.nextUrl.searchParams.get("q")?.trim() || "");
  const results = q
    ? await prisma.registration.findMany({
        where: { OR: [{ delegateId: q }, { email: { contains: q, mode: "insensitive" } }], status: "PAID" },
        select: { id: true, delegateId: true, fullName: true, trackName: true, checkedInDay1: true, checkedInDay2: true },
        take: 10
      })
    : [];
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

// If scanQ looks like delegateId.sig (ie from QR), verify signature before proceeding
let target: any = null;
let competitionTarget: any = null;



    // If not found, try competitions
    if (!target) {

if (!id && scanQ) {
  const sigDot = scanQ.lastIndexOf(".");

  // Competition QR
  if (scanQ.startsWith("NDGYS-C-")) {
    let competitionRef = scanQ;

    if (sigDot > 0) {
      competitionRef = scanQ.substring(0, sigDot);
    }

    competitionTarget =
      await prisma.competitionRegistration.findFirst({
        where: {
          status: "PAID",
          OR: [
            { refId: competitionRef },
            {
              email: {
                contains: competitionRef,
                mode: "insensitive",
              },
            },
          ],
        },
      });

  // MUN signed QR
  } else if (sigDot > 0) {
    const dId = scanQ.slice(0, sigDot);
    const sig = scanQ.slice(sigDot + 1);

    if (!verifySignature(dId, sig)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    target = await prisma.registration.findFirst({
      where: {
        status: "PAID",
        delegateId: dId,
      },
    });

  // Manual MUN lookup
  } else {
    target = await prisma.registration.findFirst({
      where: {
        status: "PAID",
        OR: [
          { delegateId: scanQ },
          {
            email: {
              contains: scanQ,
              mode: "insensitive",
            },
          },
        ],
      },
    });
  }
}
    
    
    
    
    }  else if (id) {
  target = await prisma.registration.findUnique({
    where: { id },
  });
}

if (!target && !competitionTarget) {
  return NextResponse.json(
    {
      error: "No paid participant found.",
      debug: {
        scanQ,
        competitionFound: !!competitionTarget,
        munFound: !!target,
      },
    },
    { status: 404 }
  );
}

// Competition auto check-in
if (competitionTarget) {
  const updated =
    await prisma.competitionRegistration.update({
      where: {
        id: competitionTarget.id,
      },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
      },
    });

  await audit(
    admin.email,
    "competition.checkin.scan",
    "CompetitionRegistration",
    updated.id,
    `refId=${updated.refId}`
  );

  return NextResponse.json({
    ok: true,
    competition: true,
    registration: updated,
  });
}
  
  
  
  
  
  id = target.id;
  const value = b?.value === undefined ? true : !!b.value;

  // Idempotent behaviour: if already checked in for this day and trying to set true, return existing info
  const already = day === 1 ? !!target.checkedInDay1 : !!target.checkedInDay2;
  if (value === true && already) {
    // find existing audit log for this registration and day
    const existing = await prisma.adminAction.findFirst({
      where: { entity: "Registration", entityId: id, action: { startsWith: "checkin" }, meta: { contains: `day${day}=true` } },
      orderBy: { createdAt: "desc" }
    });
    const when = existing ? existing.createdAt.toISOString() : null;
    return NextResponse.json({ ok: true, alreadyCheckedIn: true, when });
  }

  const data = day === 1 ? { checkedInDay1: value } : { checkedInDay2: value };
  const reg = await prisma.registration.update({ where: { id }, data });
  await audit(admin.email, b?.q ? "checkin.scan" : "checkin.manual", "Registration", id, `day${day}=${value};q=${scanQ || ""}`);

  const counts = await checkinCounts();
  const recent = await recentCheckins();
  return NextResponse.json({ ok: true, registration: { id: reg.id, checkedInDay1: reg.checkedInDay1, checkedInDay2: reg.checkedInDay2 }, ...counts, recent });
}
