export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const [regs, messages, tracks, statusGroups, recent] = await Promise.all([
    prisma.registration.findMany({ select: { status: true, amount: true, trackSlug: true, trackName: true, experience: true, createdAt: true } }),
    prisma.contactMessage.count({ where: { handled: false } }),
    prisma.track.findMany({ select: { slug: true, name: true, capacity: true } }),
    prisma.registration.groupBy({ by: ["status"], _count: true }),
    prisma.adminAction.findMany({ orderBy: { createdAt: "desc" }, take: 10 })
  ]);
  type RegLite = { status: string; amount: number; trackSlug: string; trackName: string; experience: string | null; createdAt: Date };
  type TrackLite = { slug: string; name: string; capacity: number };
  const R = regs as unknown as RegLite[];
  const T = tracks as unknown as TrackLite[];

  const counts = statusGroups as unknown as { status: string; _count: number }[];
  const paid = counts.find((s) => s.status === "PAID")?._count ?? 0;
  const pending = counts.find((s) => s.status === "PENDING")?._count ?? 0;
  const cancelled = counts.find((s) => s.status === "CANCELLED")?._count ?? 0;
  const revenue = R.filter((r) => r.status === "PAID").reduce((s, r) => s + r.amount, 0);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todaySignups = R.filter((r) => r.createdAt >= today).length;

  // per-track fill
  const perTrack = T.map((t) => {
    const paidIn = R.filter((r) => r.trackSlug === t.slug && r.status === "PAID").length;
    return { name: t.name, paid: paidIn, capacity: t.capacity };
  });

  // registrations over last 14 days
  const series: { date: string; count: number; revenue: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    const dayRegs = R.filter((r) => r.createdAt >= d && r.createdAt < next);
    series.push({
      date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      count: dayRegs.length,
      revenue: dayRegs.filter((r) => r.status === "PAID").reduce((s, r) => s + r.amount, 0) / 100
    });
  }

  const experience = {
    beginner: R.filter((r) => r.experience === "beginner").length,
    experienced: R.filter((r) => r.experience === "experienced").length
  };

  return NextResponse.json({
    summary: { paid, pending, cancelled, revenueInr: revenue / 100, todaySignups, unreadMessages: messages, total: regs.length },
    perTrack, series, experience, recent
  });
}
