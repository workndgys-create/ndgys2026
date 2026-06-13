import { NextRequest, NextResponse } from "next/server";
import { listPortfolios } from "@/lib/portfolios";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const track = req.nextUrl.searchParams.get("track");
    const reg = req.nextUrl.searchParams.get("reg");

    if (!track) {
      return NextResponse.json({ error: "track required" }, { status: 422 });
    }

    // Special-case International Press: return three aggregated portfolio categories
    const trackSlug = track as string;
    const trackRow = await prisma.track.findUnique({ where: { slug: trackSlug } });
    const isInternationalPress = trackRow && String(trackRow.name).trim().toLowerCase() === "international press";

    if (!isInternationalPress) {
      const portfolios = await listPortfolios(trackSlug, reg);
      return NextResponse.json({ ok: true, count: portfolios.length, portfolios });
    }

    // Mirror the capacities used by the public API
    const capJournalistRow = await prisma.setting.findUnique({ where: { key: "international-press.capacity.journalist" } });
    const capCaricatureRow = await prisma.setting.findUnique({ where: { key: "international-press.capacity.caricature" } });
    const capPhotographerRow = await prisma.setting.findUnique({ where: { key: "international-press.capacity.photographer" } });
    const capJournalist = Number(capJournalistRow?.value ?? "50");
    const capCaricature = Number(capCaricatureRow?.value ?? "50");
    const capPhotographer = Number(capPhotographerRow?.value ?? "30");

    const journalistCount = await prisma.registration.count({ where: { status: "PAID", trackSlug: trackSlug, portfolio: { contains: "journalist", mode: "insensitive" } } });
    const caricatureCount = await prisma.registration.count({ where: { status: "PAID", trackSlug: trackSlug, portfolio: { contains: "caricature", mode: "insensitive" } } });
    const photographerCount = await prisma.registration.count({ where: { status: "PAID", trackSlug: trackSlug, portfolio: { contains: "photographer", mode: "insensitive" } } });

    const remainingJournalist = Math.max(0, capJournalist - journalistCount);
    const remainingCaricature = Math.max(0, capCaricature - caricatureCount);
    const remainingPhotographer = Math.max(0, capPhotographer - photographerCount);

    const now = new Date();

    // For each category, attempt to find one representative AVAILABLE portfolio row to use for holds.
    async function findAvailableSample(category: string) {
      const r = await prisma.portfolio.findFirst({
        where: {
          trackSlug: trackSlug,
          name: { contains: category, mode: "insensitive" },
          OR: [
            { status: "AVAILABLE" },
            { status: "HELD", heldUntil: { lt: now } }
          ]
        },
        orderBy: [{ order: "asc" }, { name: "asc" }]
      });
      return r ? { id: r.id, name: r.name } : null;
    }

    const sampleJournalist = remainingJournalist > 0 ? await findAvailableSample("journalist") : null;
    const sampleCaricature = remainingCaricature > 0 ? await findAvailableSample("caricature") : null;
    const samplePhotographer = remainingPhotographer > 0 ? await findAvailableSample("photographer") : null;

    const out = [
      {
        id: sampleJournalist ? sampleJournalist.id : `none-journalist`,
        name: "Journalist",
        // Only mark available if there is both remaining capacity AND an actual portfolio row to hold
        state: remainingJournalist > 0 && sampleJournalist ? "available" : "taken",
        remaining: remainingJournalist,
        capacity: capJournalist,
      },
      {
        id: sampleCaricature ? sampleCaricature.id : `none-caricature`,
        name: "Caricature",
        state: remainingCaricature > 0 && sampleCaricature ? "available" : "taken",
        remaining: remainingCaricature,
        capacity: capCaricature,
      },
      {
        id: samplePhotographer ? samplePhotographer.id : `none-photographer`,
        name: "Photographer",
        state: remainingPhotographer > 0 && samplePhotographer ? "available" : "taken",
        remaining: remainingPhotographer,
        capacity: capPhotographer,
      },
    ];

    return NextResponse.json({ ok: true, count: out.length, portfolios: out });
  } catch (error) {
    console.error("PORTFOLIOS API ERROR:", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
