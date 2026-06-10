import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, requirePermission, audit } from "@/lib/adminSession";
import { getSetting, setSetting } from "@/lib/settings";

export const runtime = "nodejs";

type HouseSummary = {
  house: number;
  total: number;
  available: number;
  held: number;
  assigned: number;
};

function parseHouse(name: string): number | null {
  const m = /^house\s+(\d+)\s*-/i.exec(name.trim());
  if (!m) return null;
  const v = Number(m[1]);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : null;
}

async function getSummary(): Promise<{ activeHouse: number; houses: HouseSummary[] }> {
  const activeHouseRaw = Number(await getSetting("ipl.auction.activeHouse", "1"));
  const activeHouse = Number.isFinite(activeHouseRaw) && activeHouseRaw > 0 ? Math.floor(activeHouseRaw) : 1;

  const rows = await prisma.portfolio.findMany({
    where: { trackSlug: "ipl" },
    select: { name: true, status: true }
  });

  const byHouse = new Map<number, HouseSummary>();
  for (const row of rows) {
    const house = parseHouse(row.name);
    if (house == null) continue;
    const current = byHouse.get(house) ?? { house, total: 0, available: 0, held: 0, assigned: 0 };
    current.total += 1;
    if (row.status === "AVAILABLE") current.available += 1;
    else if (row.status === "HELD") current.held += 1;
    else current.assigned += 1;
    byHouse.set(house, current);
  }

  return { activeHouse, houses: Array.from(byHouse.values()).sort((a, b) => a.house - b.house) };
}

export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getSummary());
}

export async function PATCH(req: NextRequest) {
  const s = await requirePermission("allocations.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  const action = typeof b.action === "string" ? b.action : "";

  if (action === "openNext") {
    const { activeHouse, houses } = await getSummary();
    const current = houses.find((h) => h.house === activeHouse);
    if (current && (current.available > 0 || current.held > 0)) {
      return NextResponse.json(
        { error: `House ${activeHouse} is not sold out yet. Assign or expire remaining slots before opening the next house.` },
        { status: 409 }
      );
    }

    const next = activeHouse + 1;
    const nextSummary = houses.find((h) => h.house === next);
    if (!nextSummary) {
      return NextResponse.json({ error: `No slots found for House ${next}. Add house slots first.` }, { status: 422 });
    }

    await setSetting("ipl.auction.activeHouse", String(next));
    await audit(s.email, "ipl.house.openNext", "Setting", undefined, JSON.stringify({ from: activeHouse, to: next }));
    return NextResponse.json(await getSummary());
  }

  if (typeof b.activeHouse === "number") {
    const target = Math.floor(b.activeHouse);
    if (!Number.isFinite(target) || target < 1) {
      return NextResponse.json({ error: "activeHouse must be a positive integer." }, { status: 422 });
    }

    const { houses } = await getSummary();
    if (!houses.some((h) => h.house === target)) {
      return NextResponse.json({ error: `No slots found for House ${target}.` }, { status: 422 });
    }

    await setSetting("ipl.auction.activeHouse", String(target));
    await audit(s.email, "ipl.house.set", "Setting", undefined, JSON.stringify({ activeHouse: target }));
    return NextResponse.json(await getSummary());
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 422 });
}
