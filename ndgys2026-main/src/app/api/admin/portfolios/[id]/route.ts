import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("allocations.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if ("name" in b && b.name) data.name = String(b.name).trim();
  if ("trackSlug" in b && b.trackSlug) data.trackSlug = b.trackSlug;
  if ("order" in b) data.order = Number(b.order) || 0;
  const item = await prisma.portfolio.update({ where: { id: params.id }, data });
  await audit(s.email, "portfolio.update", "Portfolio", params.id);
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("allocations.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.portfolio.delete({ where: { id: params.id } });
  await audit(s.email, "portfolio.delete", "Portfolio", params.id);
  return NextResponse.json({ ok: true });
}
