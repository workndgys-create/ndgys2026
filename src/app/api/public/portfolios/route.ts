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
    // Exclude Lok Sabha city portfolios from public listing
    const LOK_SABHA_EXCLUDE = new Set([
      "Mumbai (South)", "Delhi Central", "Bangalore South", "Chennai South", "Hyderabad",
      "Kolkata South", "Chandigarh", "Lucknow", "Pune", "Ahmedabad", "Jaipur", "Indore"
    ]);

    for (const r of rows) {
      if (String(r.trackSlug).toLowerCase() === "lok-sabha" && LOK_SABHA_EXCLUDE.has(r.name)) continue;
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

        // For International Press: treat committee as composed of three portfolios with independent capacities.
        // Capacities can be configured via Settings (keys below); defaults: Journalist=50, Caricature=50, Photographer=30.
        const capJournalistRow = await prisma.setting.findUnique({ where: { key: "international-press.capacity.journalist" } });
        const capCaricatureRow = await prisma.setting.findUnique({ where: { key: "international-press.capacity.caricature" } });
        const capPhotographerRow = await prisma.setting.findUnique({ where: { key: "international-press.capacity.photographer" } });
        const capJournalist = Number(capJournalistRow?.value ?? "50");
        const capCaricature = Number(capCaricatureRow?.value ?? "50");
        const capPhotographer = Number(capPhotographerRow?.value ?? "30");

        // Count taken seats per category by looking for registrations with matching portfolio labels (case-insensitive contains).
        const journalistCount = await prisma.registration.count({ where: { status: "PAID", trackSlug: slug, portfolio: { contains: "journalist", mode: "insensitive" } } });
        const caricatureCount = await prisma.registration.count({ where: { status: "PAID", trackSlug: slug, portfolio: { contains: "caricature", mode: "insensitive" } } });
        const photographerCount = await prisma.registration.count({ where: { status: "PAID", trackSlug: slug, portfolio: { contains: "photographer", mode: "insensitive" } } });

        const portfoliosOut = [
          { name: "Journalist", taken: journalistCount > 0, archived: false, takenCount: journalistCount, capacity: capJournalist, remaining: Math.max(0, capJournalist - journalistCount) },
          { name: "Caricature", taken: caricatureCount > 0, archived: false, takenCount: caricatureCount, capacity: capCaricature, remaining: Math.max(0, capCaricature - caricatureCount) },
          { name: "Photographer", taken: photographerCount > 0, archived: false, takenCount: photographerCount, capacity: capPhotographer, remaining: Math.max(0, capPhotographer - photographerCount) }
        ];

        const total = capJournalist + capCaricature + capPhotographer;
        const taken = journalistCount + caricatureCount + photographerCount;

        return { slug, name: displayName, total, taken, portfolios: portfoliosOut };
      })
    );

    committees.sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99));

    return NextResponse.json({ committees, generatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ committees: [], generatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  }
}
