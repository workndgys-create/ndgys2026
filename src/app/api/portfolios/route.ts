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

    // Some DB rows use slightly different labels (e.g. "Caricaturist 01").
    // Use keyword lists so counting and sample lookups match real portfolio names.
    const KEYWORDS: Record<string, string[]> = {
      journalist: ["journalist"],
      caricature: ["caricature", "caricaturist"],
      photographer: ["photograph", "photographer"]
    };

    async function countFor(keywords: string[]) {
      // Build an OR over portfolio contains clauses
      return prisma.registration.count({
        where: {
          status: "PAID",
          trackSlug: trackSlug,
          OR: keywords.map((k) => ({ portfolio: { contains: k, mode: "insensitive" } }))
        }
      });
    }

    const journalistCount = await countFor(KEYWORDS.journalist);
    const caricatureCount = await countFor(KEYWORDS.caricature);
    const photographerCount = await countFor(KEYWORDS.photographer);

    const remainingJournalist = Math.max(0, capJournalist - journalistCount);
    const remainingCaricature = Math.max(0, capCaricature - caricatureCount);
    const remainingPhotographer = Math.max(0, capPhotographer - photographerCount);

    const now = new Date();

    // For each category, attempt to find one representative AVAILABLE portfolio row to use for holds.
    async function findAvailableSample(category: string) {
      const keywords = KEYWORDS[category as keyof typeof KEYWORDS] || [category];
      const r = await prisma.portfolio.findFirst({
        where: {
          trackSlug: trackSlug,
          OR: keywords.map((k) => ({ name: { contains: k, mode: "insensitive" } })),
          AND: [
            {
              OR: [
                { status: "AVAILABLE" },
                { status: "HELD", heldUntil: { lt: now } },
                // Treat a portfolio HELD by the requesting registration as available
                ...(reg ? [{ status: "HELD", heldBy: reg }] : [])
              ]
            }
          ]
        },
        orderBy: [{ order: "asc" }, { name: "asc" }]
      });
      return r ? { id: r.id, name: r.name } : null;
    }

    const sampleJournalist = remainingJournalist > 0 ? await findAvailableSample("journalist") : null;
    const sampleCaricature = remainingCaricature > 0 ? await findAvailableSample("caricature") : null;
    const samplePhotographer = remainingPhotographer > 0 ? await findAvailableSample("photographer") : null;

    // Expose categories as AVAILABLE as long as their paid seats are below capacity.
    // When there is no immediate sample row to hold (all rows currently HELD by others),
    // return the category label as the id so the frontend can send it back and the
    // register route will attempt to resolve an underlying row at submit-time.
    const out = [
      {
        id: sampleJournalist ? sampleJournalist.id : `journalist`,
        name: "Journalist",
        state: remainingJournalist > 0 ? "available" : "taken",
        remaining: remainingJournalist,
        capacity: capJournalist,
      },
      {
        id: sampleCaricature ? sampleCaricature.id : `caricature`,
        name: "Caricature",
        state: remainingCaricature > 0 ? "available" : "taken",
        remaining: remainingCaricature,
        capacity: capCaricature,
      },
      {
        id: samplePhotographer ? samplePhotographer.id : `photographer`,
        name: "Photographer",
        state: remainingPhotographer > 0 ? "available" : "taken",
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
