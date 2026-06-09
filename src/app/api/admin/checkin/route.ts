import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

// lookup by ?q=delegateId|email
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (!q) return NextResponse.json({ results: [] });
  const results = await prisma.registration.findMany({
    where: { OR: [{ delegateId: q }, { email: { contains: q, mode: "insensitive" } }], status: "PAID" },
    select: { id: true, delegateId: true, fullName: true, trackName: true, checkedInDay1: true, checkedInDay2: true },
    take: 10
  });
  const day1Count = await prisma.registration.count({ where: { checkedInDay1: true } });
  const day2Count = await prisma.registration.count({ where: { checkedInDay2: true } });
  const totalUnique = await prisma.registration.count({ where: { OR: [{ checkedInDay1: true }, { checkedInDay2: true }] } });
  return NextResponse.json({ results, day1Count, day2Count, totalUnique });
}

export async function POST(req: NextRequest) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b?.id || ![1, 2].includes(b.day)) return NextResponse.json({ error: "Bad request" }, { status: 422 });
  const data = b.day === 1 ? { checkedInDay1: !!b.value } : { checkedInDay2: !!b.value };
  const reg = await prisma.registration.update({ where: { id: b.id }, data });
  await audit(admin.email, "checkin", "Registration", b.id, `day${b.day}=${!!b.value}`);
  const day1Count = await prisma.registration.count({ where: { checkedInDay1: true } });
  const day2Count = await prisma.registration.count({ where: { checkedInDay2: true } });
  const totalUnique = await prisma.registration.count({ where: { OR: [{ checkedInDay1: true }, { checkedInDay2: true }] } });
  return NextResponse.json({ ok: true, registration: { id: reg.id, checkedInDay1: reg.checkedInDay1, checkedInDay2: reg.checkedInDay2 }, day1Count, day2Count, totalUnique });
}
