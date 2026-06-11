import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const k of ["title", "startTime", "endTime", "room", "trackSlug"]) if (k in b) data[k] = b[k] || null;
  if ("day" in b) data.day = Number(b.day) || 1;
  if ("order" in b) data.order = Number(b.order) || 0;
  if ("published" in b) data.published = !!b.published;
  const item = await prisma.scheduleItem.update({ where: { id: params.id }, data });
  await audit(s.email, "schedule.update", "ScheduleItem", params.id);
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.scheduleItem.delete({ where: { id: params.id } });
  await audit(s.email, "schedule.delete", "ScheduleItem", params.id);
  return NextResponse.json({ ok: true });
}
