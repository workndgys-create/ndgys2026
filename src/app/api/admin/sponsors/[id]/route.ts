import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if ("name" in b && b.name) data.name = b.name;
  if ("logoUrl" in b) data.logoUrl = b.logoUrl || null;
  if ("websiteUrl" in b) data.websiteUrl = b.websiteUrl || null;
  if ("tier" in b) data.tier = b.tier || null;
  if ("order" in b) data.order = Number(b.order) || 0;
  if ("published" in b) data.published = b.published === true || b.published === "true";
  const item = await prisma.sponsor.update({ where: { id: params.id }, data });
  await audit(s.email, "sponsor.update", "Sponsor", params.id);
  return NextResponse.json({ ok: true, item });
}
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.sponsor.delete({ where: { id: params.id } });
  await audit(s.email, "sponsor.delete", "Sponsor", params.id);
  return NextResponse.json({ ok: true });
}
