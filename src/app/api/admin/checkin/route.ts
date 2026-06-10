import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, audit } from "@/lib/adminSession";
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
    // plain text scan, keep original handling below
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

  let target = id
    ? await prisma.registration.findUnique({ where: { id } })
    : await prisma.registration.findFirst({ where: { status: "PAID", OR: [{ delegateId: scanQ }, { email: { contains: scanQ, mode: "insensitive" } }] } });

  if (!target || target.status !== "PAID") return NextResponse.json({ error: "No paid participant found for this scan." }, { status: 404 });

  id = target.id;
  const value = b?.value === undefined ? true : !!b.value;
  const data = day === 1 ? { checkedInDay1: value } : { checkedInDay2: value };
  const reg = await prisma.registration.update({ where: { id }, data });
  await audit(admin.email, b?.q ? "checkin.scan" : "checkin.manual", "Registration", id, `day${day}=${value};q=${scanQ || ""}`);

  const counts = await checkinCounts();
  const recent = await recentCheckins();
  return NextResponse.json({ ok: true, registration: { id: reg.id, checkedInDay1: reg.checkedInDay1, checkedInDay2: reg.checkedInDay2 }, ...counts, recent });
}
