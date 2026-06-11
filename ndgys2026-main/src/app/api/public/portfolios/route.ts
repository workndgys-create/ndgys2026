import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TRACKS } from "@/lib/validation";
import { releaseExpiredHolds } from "@/lib/portfolios";
export const runtime = "nodejs";

export async function GET() {
  try {
    await releaseExpiredHolds();
    type P = { trackSlug: string; name: string; order: number; status: string; archived: boolean };
    const rows = (await prisma.portfolio.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] })) as unknown as P[];
    const order = new Map<string, number>(TRACKS.map((t, i) => [t.slug as string, i]));
    const nameBySlug = new Map<string, string>(TRACKS.map((t) => [t.slug as string, t.name]));

    const byTrack = new Map<string, { name: string; taken: boolean; archived: boolean }[]>();
    for (const r of rows) {
      const list = byTrack.get(r.trackSlug) ?? [];
      list.push({ name: r.name, taken: r.status === "ASSIGNED", archived: !!r.archived });
      byTrack.set(r.trackSlug, list);
    }

    const committees = await Promise.all(
      Array.from(byTrack.entries()).map(async ([slug, portfolios]) => {
        const displayName = nameBySlug.get(slug) ?? slug;
        const isInternationalPress = String(displayName).trim().toLowerCase() === "international press";
        if (!isInternationalPress) {
          return {
            slug,
            name: displayName,
            total: portfolios.length,
            taken: portfolios.filter((p) => p.taken).length,
            portfolios
          };
        }

        // For International Press: treat committee as having 130 seats and only expose three portfolio categories.
        const total = 130;
        // Count taken seats by counting registrations that have a portfolio set for this track
        const taken = await prisma.registration.count({ where: { status: "PAID", trackSlug: slug, NOT: { portfolio: null } } });

        // Determine whether each category has any allocations (used to style chips)
        const journalistCount = await prisma.registration.count({ where: { status: "PAID", trackSlug: slug, portfolio: { contains: "journalist", mode: "insensitive" } } });
        const caricatureCount = await prisma.registration.count({ where: { status: "PAID", trackSlug: slug, portfolio: { contains: "caricature", mode: "insensitive" } } });
        const photographerCount = await prisma.registration.count({ where: { status: "PAID", trackSlug: slug, portfolio: { contains: "photographer", mode: "insensitive" } } });

        const portfoliosOut = [
          { name: "Journalist", taken: journalistCount > 0, archived: false },
          { name: "Caricature", taken: caricatureCount > 0, archived: false },
          { name: "Photographer", taken: photographerCount > 0, archived: false }
        ];

        return { slug, name: displayName, total, taken, portfolios: portfoliosOut };
      })
    );

    committees.sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99));

    return NextResponse.json({ committees, generatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ committees: [], generatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  }
}
