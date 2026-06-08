import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `speaker-${Date.now()}`;

export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.speaker.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b?.name || !b?.title) return NextResponse.json({ error: "Name and title are required" }, { status: 422 });
  const item = await prisma.speaker.create({
    data: { slug: b.slug ? slugify(b.slug) : slugify(b.name), name: b.name, title: b.title, bio: b.bio || "", imageUrl: b.imageUrl || null, order: Number(b.order) || 0 }
  });
  await audit(s.email, "speaker.create", "Speaker", item.id);
  return NextResponse.json({ ok: true, id: item.id });
}
