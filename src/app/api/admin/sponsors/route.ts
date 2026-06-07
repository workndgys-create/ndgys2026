import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.sponsor.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ items });
}
export async function POST(req: NextRequest) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b?.name) return NextResponse.json({ error: "Name is required" }, { status: 422 });
  const item = await prisma.sponsor.create({
    data: { name: b.name, logoUrl: b.logoUrl || null, websiteUrl: b.websiteUrl || null, tier: b.tier || null, order: Number(b.order) || 0, published: b.published === undefined ? true : (b.published === true || b.published === "true") }
  });
  await audit(s.email, "sponsor.create", "Sponsor", item.id);
  return NextResponse.json({ ok: true, id: item.id });
}
