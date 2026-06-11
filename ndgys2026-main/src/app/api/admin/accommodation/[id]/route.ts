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
  if ("kind" in b && ["Hotel", "Travel", "Nearby"].includes(b.kind)) data.kind = b.kind;
  if ("description" in b && b.description) data.description = b.description;
  if ("address" in b) data.address = b.address || null;
  if ("distance" in b) data.distance = b.distance || null;
  if ("priceRange" in b) data.priceRange = b.priceRange || null;
  if ("url" in b) data.url = b.url || null;
  if ("imageUrl" in b) data.imageUrl = b.imageUrl || null;
  if ("order" in b) data.order = Number(b.order) || 0;
  if ("published" in b) data.published = b.published === true || b.published === "true";
  const item = await prisma.accommodationOption.update({ where: { id: params.id }, data });
  await audit(s.email, "accommodation.update", "AccommodationOption", params.id);
  return NextResponse.json({ ok: true, item });
}
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.accommodationOption.delete({ where: { id: params.id } });
  await audit(s.email, "accommodation.delete", "AccommodationOption", params.id);
  return NextResponse.json({ ok: true });
}
