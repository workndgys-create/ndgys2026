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

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return NextResponse.json({ error: "Nothing to import" }, { status: 422 });

  // Load active committees (tracks) to resolve names/slugs
  const allTracks = await prisma.track.findMany({ where: { archived: false } });
  const trackMap = new Map<string, string>();
  for (const t of allTracks) {
    trackMap.set(t.slug.toLowerCase(), t.slug);
    trackMap.set(t.name.toLowerCase(), t.slug);
  }

  // Load all existing portfolios so we can skip duplicates
  const existing = await prisma.portfolio.findMany({
    select: { trackSlug: true, name: true, order: true }
  });
  const have = new Set(existing.map((e) => `${e.trackSlug.toLowerCase()}::${e.name.toLowerCase()}`));

  // Keep track of the current max order for each committee to compute next order
  const orderMap = new Map<string, number>();
  for (const e of existing) {
    const slugLower = e.trackSlug.toLowerCase();
    const currentMax = orderMap.get(slugLower) ?? -1;
    orderMap.set(slugLower, Math.max(currentMax, e.order));
  }

  let created = 0, skipped = 0, errors = 0;
  const creations: { trackSlug: string; name: string; order: number }[] = [];

  for (const line of lines) {
    let resolvedSlug: string | undefined = undefined;
    let nameVal = "";

    const commaIdx = line.indexOf(",");
    if (commaIdx !== -1) {
      // Line is: "committee, portfolio name"
      const trackToken = line.slice(0, commaIdx).trim().toLowerCase();
      nameVal = line.slice(commaIdx + 1).replace(/^[-*]\s*/, "").trim();
      resolvedSlug = trackMap.get(trackToken);
    } else {
      // Line has no comma. Use global trackSlug if provided
      nameVal = line.replace(/^[-*]\s*/, "").trim();
      if (trackSlug) {
        resolvedSlug = trackMap.get(trackSlug.toLowerCase());
      }
    }

    if (!resolvedSlug || !nameVal) {
      errors++;
      continue;
    }

    const key = `${resolvedSlug.toLowerCase()}::${nameVal.toLowerCase()}`;
    if (have.has(key)) {
      skipped++;
      continue;
    }

    const slugLower = resolvedSlug.toLowerCase();
    const nextOrder = (orderMap.get(slugLower) ?? -1) + 1;
    orderMap.set(slugLower, nextOrder);

    creations.push({
      trackSlug: resolvedSlug,
      name: nameVal,
      order: nextOrder
    });
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
