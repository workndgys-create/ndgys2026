import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.scheduleItem.findMany({ orderBy: [{ day: "asc" }, { order: "asc" }] });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b?.title || !b?.startTime || !b?.endTime) return NextResponse.json({ error: "Title and times are required" }, { status: 422 });
  const item = await prisma.scheduleItem.create({
    data: { day: Number(b.day) || 1, startTime: b.startTime, endTime: b.endTime, title: b.title, room: b.room || null, trackSlug: b.trackSlug || null, published: b.published !== false, order: Number(b.order) || 0 }
  });
  await audit(s.email, "schedule.create", "ScheduleItem", item.id);
  return NextResponse.json({ ok: true, id: item.id });
}
