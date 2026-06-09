import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

export async function GET() {
  const items = await prisma.announcement.findMany({ orderBy: { publishedAt: "desc" }, take: 100 });
  return NextResponse.json({ announcements: items });
}
export async function POST(req: NextRequest) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b?.title || !b?.body) return NextResponse.json({ error: "Missing fields" }, { status: 422 });
  const a = await prisma.announcement.create({
    data: { title: b.title, body: b.body, audience: (b.audience || "ALL"), trackSlug: b.trackSlug || null }
  });
  await audit(admin.email, "announcement.create", "Announcement", a.id);
  return NextResponse.json({ ok: true, id: a.id });
}
