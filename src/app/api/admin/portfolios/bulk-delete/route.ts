import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const admin = await requirePermission("allocations.manage");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => null);
  const ids = Array.isArray(b?.ids) ? (b.ids as string[]) : [];
  if (ids.length === 0) return NextResponse.json({ error: "No ids provided" }, { status: 422 });

  try {
    await prisma.portfolio.updateMany({ where: { id: { in: ids } }, data: { archived: true } });
    await audit(admin.email, "portfolio.bulk.delete", "Portfolio", undefined, JSON.stringify({ ids }));
    return NextResponse.json({ ok: true, count: ids.length });
  } catch (err) {
    console.error("[admin/portfolios/bulk-delete]", err);
    return NextResponse.json({ error: "Failed to archive portfolios" }, { status: 500 });
  }
}
