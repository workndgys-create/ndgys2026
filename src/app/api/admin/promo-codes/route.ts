import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const items = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[admin/promo-codes] GET failed", error);
    return NextResponse.json({ error: "Failed to load promo codes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const s = await requirePermission("settings.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const b = await req.json().catch(() => null);
    if (!b?.code || !b?.value) return NextResponse.json({ error: "Code and value are required" }, { status: 422 });
    const code = String(b.code).trim().toUpperCase();
    const exists = await prisma.promoCode.findUnique({ where: { code } });
    if (exists) return NextResponse.json({ error: "That code already exists" }, { status: 409 });
    const item = await prisma.promoCode.create({
      data: {
        code, kind: b.kind === "FLAT" ? "FLAT" : "PERCENT", value: Number(b.value),
        maxUses: b.maxUses ? Number(b.maxUses) : null, appliesTo: b.appliesTo || null,
        active: b.active === undefined ? true : (b.active === true || b.active === "true"),
        expiresAt: b.expiresAt ? new Date(b.expiresAt) : null
      }
    });
    await audit(s.email, "promo.create", "PromoCode", item.id);
    return NextResponse.json({ ok: true, id: item.id });
  } catch (error) {
    console.error("[admin/promo-codes] POST failed", { email: s.email, error });
    return NextResponse.json({ error: "Failed to save promo code" }, { status: 500 });
  }
}
