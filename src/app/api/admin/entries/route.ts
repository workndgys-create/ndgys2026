import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [regs, unreadMessages, tracks, recent] = await Promise.all([
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

      prisma.adminAction.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),
    ]);

    const paid = regs.filter((r: any) => r.status === "PAID").length;
    const pending = regs.filter((r: any) => r.status === "PENDING").length;
    const cancelled = regs.filter((r: any) => r.status === "CANCELLED").length;

    const revenue = regs
      .filter((r: any) => r.status === "PAID")
      .reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySignups = regs.filter(
      (r: any) => new Date(r.createdAt) >= today
    ).length;

    const perTrack = tracks.map((track: any) => {
      const paidCount = regs.filter(
        (r: any) =>
          r.trackSlug === track.slug &&
          r.status === "PAID"
      ).length;

      return {
        name: track.name,
        paid: paidCount,
        capacity: track.capacity,
      };
    });

    const series = [];

    for (let i = 13; i >= 0; i--) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - i);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const dayRegs = regs.filter(
        (r: any) =>
          new Date(r.createdAt) >= start &&
          new Date(r.createdAt) < end
      );

      series.push({
        date: start.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        count: dayRegs.length,
        revenue:
          dayRegs
            .filter((r: any) => r.status === "PAID")
            .reduce(
              (sum: number, r: any) => sum + (r.amount ?? 0),
              0
            ) / 100,
      });
    }

    const experience = {
      beginner: regs.filter(
        (r: any) => r.experience === "beginner"
      ).length,

      experienced: regs.filter(
        (r: any) => r.experience === "experienced"
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

    return NextResponse.json({
      summary: {
        paid: 0,
        pending: 0,
        cancelled: 0,
        revenueInr: 0,
        todaySignups: 0,
        unreadMessages: 0,
        total: 0,
      },
      perTrack: [],
      series: [],
      experience: {
        beginner: 0,
        experienced: 0,
      },
      recent: [],
    });
  }
}
