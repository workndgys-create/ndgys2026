import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const k of ["title", "kind", "summary", "venue", "imageUrl"]) if (k in b) data[k] = b[k] || null;
  if ("published" in b) data.published = !!b.published;
  if ("order" in b) data.order = Number(b.order) || 0;
  if ("startsAt" in b) data.startsAt = b.startsAt ? new Date(b.startsAt) : null;
  if ("endsAt" in b) data.endsAt = b.endsAt ? new Date(b.endsAt) : null;
  const item = await prisma.event.update({ where: { id: params.id }, data });
  await audit(s.email, "event.update", "Event", params.id);
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.event.delete({ where: { id: params.id } });
  await audit(s.email, "event.delete", "Event", params.id);
  return NextResponse.json({ ok: true });
}
