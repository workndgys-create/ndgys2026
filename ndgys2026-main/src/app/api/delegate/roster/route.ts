import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentDelegate } from "@/lib/delegateSession";
import { maskName } from "@/lib/names";
export const runtime = "nodejs";

/** Roster for the delegate's own committee: each portfolio + (opted-in, paid) holder name, masked. */
export async function GET() {
  const me = await currentDelegate();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  type P = { name: string; order: number; assignedTo: string | null };
  type H = { id: string; fullName: string; rosterOptIn: boolean };
  const portfolios = (await prisma.portfolio.findMany({ where: { trackSlug: me.trackSlug }, orderBy: [{ order: "asc" }, { name: "asc" }] })) as unknown as P[];
  const assignedIds = portfolios.map((p) => p.assignedTo).filter(Boolean) as string[];
  const holders = (assignedIds.length
    ? await prisma.registration.findMany({ where: { id: { in: assignedIds }, status: "PAID" }, select: { id: true, fullName: true, rosterOptIn: true } })
    : []) as unknown as H[];
  const byId = new Map<string, H>(holders.map((h) => [h.id, h]));

  const rows = portfolios.map((p) => {
    const h = p.assignedTo ? byId.get(p.assignedTo) : null;
    const filled = !!h;
    const display = h ? (h.rosterOptIn ? maskName(h.fullName) : "Assigned") : null;
    return { portfolio: p.name, filled, delegate: display, isMe: p.assignedTo === me.id };
  });
  return NextResponse.json({ trackName: me.trackName, filled: rows.filter((r) => r.filled).length, total: rows.length, rows });
}
