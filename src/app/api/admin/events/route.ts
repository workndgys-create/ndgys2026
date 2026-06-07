import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `event-${Date.now()}`;

export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.event.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b?.title || !b?.summary) return NextResponse.json({ error: "Title and summary are required" }, { status: 422 });
  const item = await prisma.event.create({
    data: {
      slug: b.slug ? slugify(b.slug) : slugify(b.title),
      title: b.title, kind: b.kind || "keynote", summary: b.summary, venue: b.venue || null, imageUrl: b.imageUrl || null,
      startsAt: b.startsAt ? new Date(b.startsAt) : null, endsAt: b.endsAt ? new Date(b.endsAt) : null,
      published: !!b.published, order: Number(b.order) || 0
    }
  });
  await audit(s.email, "event.create", "Event", item.id);
  return NextResponse.json({ ok: true, id: item.id });
}
