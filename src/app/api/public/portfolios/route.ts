import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TRACKS } from "@/lib/validation";
import { releaseExpiredHolds } from "@/lib/portfolios";
export const runtime = "nodejs";

export async function GET() {
  try {
    await releaseExpiredHolds();
    type P = { trackSlug: string; name: string; order: number; status: string };
    const rows = (await prisma.portfolio.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] })) as unknown as P[];
    const order = new Map<string, number>(TRACKS.map((t, i) => [t.slug as string, i]));
    const nameBySlug = new Map<string, string>(TRACKS.map((t) => [t.slug as string, t.name]));

    const byTrack = new Map<string, { name: string; taken: boolean }[]>();
    for (const r of rows) {
      const list = byTrack.get(r.trackSlug) ?? [];
      list.push({ name: r.name, taken: r.status === "ASSIGNED" });
      byTrack.set(r.trackSlug, list);
    }

    const committees = Array.from(byTrack.entries())
      .map(([slug, portfolios]) => ({
        slug,
        name: nameBySlug.get(slug) ?? slug,
        total: portfolios.length,
        taken: portfolios.filter((p) => p.taken).length,
        portfolios
      }))
      .sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99));

    return NextResponse.json({ committees, generatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ committees: [], generatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  }
}
