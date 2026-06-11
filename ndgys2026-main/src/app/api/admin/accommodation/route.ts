import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.accommodationOption.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ items });
}
export async function POST(req: NextRequest) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b?.name || !b?.description) return NextResponse.json({ error: "Name and description are required" }, { status: 422 });
  const item = await prisma.accommodationOption.create({
    data: {
      name: b.name, kind: ["Hotel", "Travel", "Nearby"].includes(b.kind) ? b.kind : "Hotel",
      description: b.description, address: b.address || null, distance: b.distance || null,
      priceRange: b.priceRange || null, url: b.url || null, imageUrl: b.imageUrl || null,
      order: Number(b.order) || 0, published: b.published === undefined ? true : (b.published === true || b.published === "true")
    }
  });
  await audit(s.email, "accommodation.create", "AccommodationOption", item.id);
  return NextResponse.json({ ok: true, id: item.id });
}
