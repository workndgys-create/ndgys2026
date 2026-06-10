import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";

export const runtime = "nodejs";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export async function POST(req: NextRequest) {
  const s = await requirePermission("allocations.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const b = await req.json().catch(() => ({} as Record<string, unknown>));

  const startHouse = Math.max(1, Number(b.startHouse) || 1);
  const houseCount = Math.max(1, Number(b.houseCount) || 1);
  const slotsPerHouse = Math.max(1, Number(b.slotsPerHouse) || 8);
  const slotLabel = String(b.slotLabel || "Team Slot").trim() || "Team Slot";

  if (houseCount > 20) {
    return NextResponse.json({ error: "House count is too large (max 20 per request)." }, { status: 422 });
  }
  if (slotsPerHouse > 200) {
    return NextResponse.json({ error: "Slots per house is too large (max 200)." }, { status: 422 });
  }

  const rows: { trackSlug: string; name: string; order: number; status: "AVAILABLE" }[] = [];
  for (let house = startHouse; house < startHouse + houseCount; house++) {
    for (let i = 1; i <= slotsPerHouse; i++) {
      rows.push({
        trackSlug: "ipl",
        name: `House ${house} - ${slotLabel} ${pad2(i)}`,
        order: (house - 1) * 1000 + i,
        status: "AVAILABLE"
      });
    }
  }

  const result = await prisma.portfolio.createMany({ data: rows, skipDuplicates: true });

  await audit(
    s.email,
    "portfolio.iplHouses.create",
    "Portfolio",
    undefined,
    JSON.stringify({ startHouse, houseCount, slotsPerHouse, slotLabel, created: result.count })
  );

  return NextResponse.json({ ok: true, created: result.count, requested: rows.length });
}
