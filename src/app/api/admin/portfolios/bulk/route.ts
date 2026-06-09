import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

function resolveTrack(token: string): string | null {
  return null; // placeholder, replaced in POST with DB lookup
}

/**
 * Bulk-create portfolios.
 * Body: { trackSlug?: string, text: string }
 *  - with trackSlug: each non-empty line is a portfolio name in that committee
 *  - without trackSlug: each line is "committee, portfolio name" (committee by slug or name)
 */
export async function POST(req: NextRequest) {
  const s = await requirePermission("allocations.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const b = await req.json().catch(() => null);
    const text: string = (b?.text || "").toString();
    const trackSlug = typeof b?.trackSlug === "string" ? b.trackSlug : undefined;

    if (!trackSlug) return NextResponse.json({ error: "Choose a committee" }, { status: 422 });
    // ensure committee exists and is active
    const track = await prisma.track.findFirst({ where: { slug: trackSlug, archived: false } });
    if (!track) return NextResponse.json({ error: "Unknown or inactive committee" }, { status: 422 });
    if (!text.trim()) return NextResponse.json({ error: "Nothing to import" }, { status: 422 });

    const lines = text.split(/\r?\n/).map((l) => l.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
    const names = Array.from(new Set(lines.map((l) => l.trim())));

    // existing names for this track
    const existing = await prisma.portfolio.findMany({ where: { trackSlug }, select: { name: true, order: true } });
    const have = new Set(existing.map((e) => e.name.toLowerCase()));
    let nextOrder = (existing.length ? Math.max(-1, ...existing.map((e) => e.order)) + 1 : 0);

    let created = 0, skipped = 0, errors = 0;
    const creations: { trackSlug: string; name: string; order: number }[] = [];
    for (const n of names) {
      if (!n) { errors++; continue; }
      const key = n.toLowerCase();
      if (have.has(key)) { skipped++; continue; }
      creations.push({ trackSlug, name: n, order: nextOrder });
      nextOrder++;
      have.add(key);
      created++;
    }

    try {
      if (creations.length > 0) {
        await prisma.$transaction(creations.map((c) => prisma.portfolio.create({ data: c })));
      }
      await audit(s.email, "portfolio.bulk", "Portfolio", undefined, `created=${created} skipped=${skipped} errors=${errors}`);
      return NextResponse.json({ ok: true, created, skipped, errors });
    } catch (err) {
      console.error("[admin/portfolios/bulk]", err);
      return NextResponse.json({ error: "Failed to import portfolios" }, { status: 500 });
    }
}
