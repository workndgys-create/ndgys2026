import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [regs, unreadMessages, tracks, statusGroups, recent] =
      await Promise.all([
        prisma.registration.findMany({
          select: {
            status: true,
            amount: true,
            trackSlug: true,
            trackName: true,
            experience: true,
            createdAt: true,
          },
        }),

        prisma.contactMessage.count({
          where: { handled: false },
        }),

        prisma.track.findMany({
          select: {
            slug: true,
            name: true,
            capacity: true,
          },
        }),

        prisma.registration.groupBy({
          by: ["status"],
          _count: {
            status: true,
          },
        }),

        prisma.adminAction.findMany({
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        }),
      ]);

    const paid =
      statusGroups.find((s) => s.status === "PAID")?._count.status ?? 0;

    const pending =
      statusGroups.find((s) => s.status === "PENDING")?._count.status ?? 0;

    const cancelled =
      statusGroups.find((s) => s.status === "CANCELLED")?._count.status ?? 0;

    const revenue = regs
      .filter((r) => r.status === "PAID")
      .reduce((sum, r) => sum + (r.amount ?? 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySignups = regs.filter(
      (r) => new Date(r.createdAt) >= today
    ).length;

    const perTrack = tracks.map((track) => {
      const paidCount = regs.filter(
        (r) =>
          r.trackSlug === track.slug &&
          r.status === "PAID"
      ).length;

      return {
        name: track.name,
        paid: paidCount,
        capacity: track.capacity,
      };
    });

    const series: {
      date: string;
      count: number;
      revenue: number;
    }[] = [];

    for (let i = 13; i >= 0; i--) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - i);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const dayRegs = regs.filter(
        (r) =>
          r.createdAt >= start &&
          r.createdAt < end
      );

      series.push({
        date: start.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        count: dayRegs.length,
        revenue:
          dayRegs
            .filter((r) => r.status === "PAID")
            .reduce((sum, r) => sum + (r.amount ?? 0), 0) / 100,
      });
    }

    const experience = {
      beginner: regs.filter(
        (r) => r.experience === "beginner"
      ).length,

      experienced: regs.filter(
        (r) => r.experience === "experienced"
      ).length,
    };

    return NextResponse.json({
      summary: {
        paid,
        pending,
        cancelled,
        revenueInr: revenue / 100,
        todaySignups,
        unreadMessages,
        total: regs.length,
      },
      perTrack,
      series,
      experience,
      recent,
    });
  } catch (error) {
    console.error("Admin entries API error:", error);

    return NextResponse.json(
      {
        error: "Failed to load dashboard data",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
