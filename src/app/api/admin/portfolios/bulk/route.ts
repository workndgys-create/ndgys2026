import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";
import { TRACKS } from "@/lib/validation";
export const runtime = "nodejs";

function resolveTrack(token: string): string | null {
  const t = token.trim().toLowerCase();
  const bySlug = TRACKS.find((x) => x.slug.toLowerCase() === t);
  if (bySlug) return bySlug.slug;
  const byName = TRACKS.find((x) => x.name.toLowerCase() === t || x.name.toLowerCase().includes(t));
  return byName ? byName.slug : null;
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
  const fixedTrack: string | null = b?.trackSlug ? resolveTrack(b.trackSlug) : null;
  if (b?.trackSlug && !fixedTrack) return NextResponse.json({ error: "Unknown committee" }, { status: 422 });
  if (!text.trim()) return NextResponse.json({ error: "Nothing to import" }, { status: 422 });

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const parsed: { trackSlug: string; name: string }[] = [];
  const unresolved: string[] = [];

  for (const line of lines) {
    if (fixedTrack) {
      parsed.push({ trackSlug: fixedTrack, name: line.replace(/^[-*]\s*/, "").trim() });
    } else {
      const idx = line.indexOf(",");
      if (idx === -1) { unresolved.push(line); continue; }
      const slug = resolveTrack(line.slice(0, idx));
      const name = line.slice(idx + 1).trim();
      if (!slug || !name) { unresolved.push(line); continue; }
      parsed.push({ trackSlug: slug, name });
    }
  }

  // existing names per track to skip duplicates + continue order numbering
  const slugs = Array.from(new Set(parsed.map((p) => p.trackSlug)));
  const existing = (await prisma.portfolio.findMany({ where: { trackSlug: { in: slugs } }, select: { trackSlug: true, name: true, order: true } })) as unknown as { trackSlug: string; name: string; order: number }[];
  const have = new Set(existing.map((e) => `${e.trackSlug}::${e.name.toLowerCase()}`));
  const nextOrder = new Map<string, number>();
  for (const slug of slugs) nextOrder.set(slug, Math.max(-1, ...existing.filter((e) => e.trackSlug === slug).map((e) => e.order)) + 1);

  let created = 0, skipped = 0;
  for (const p of parsed) {
    const key = `${p.trackSlug}::${p.name.toLowerCase()}`;
    if (have.has(key)) { skipped++; continue; }
    const order = nextOrder.get(p.trackSlug) ?? 0;
    nextOrder.set(p.trackSlug, order + 1);
    await prisma.portfolio.create({ data: { trackSlug: p.trackSlug, name: p.name, order } });
    have.add(key); created++;
  }

  await audit(s.email, "portfolio.bulk", "Portfolio", undefined, `created=${created} skipped=${skipped}`);
  return NextResponse.json({ ok: true, created, skipped, unresolved });
}
