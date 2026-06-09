import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("settings.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const b = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};
    if ("code" in b && b.code) data.code = String(b.code).trim().toUpperCase();
    if ("kind" in b) data.kind = b.kind === "FLAT" ? "FLAT" : "PERCENT";
    if ("value" in b) data.value = Number(b.value);
    if ("maxUses" in b) data.maxUses = b.maxUses ? Number(b.maxUses) : null;
    if ("appliesTo" in b) data.appliesTo = b.appliesTo || null;
    if ("active" in b) data.active = b.active === true || b.active === "true";
    if ("expiresAt" in b) data.expiresAt = b.expiresAt ? new Date(b.expiresAt) : null;
    const item = await prisma.promoCode.update({ where: { id: params.id }, data });
    await audit(s.email, "promo.update", "PromoCode", params.id);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    console.error("[admin/promo-codes] PATCH failed", { id: params.id, email: s.email, error });
    return NextResponse.json({ error: "Failed to update promo code" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("settings.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await prisma.promoCode.delete({ where: { id: params.id } });
    await audit(s.email, "promo.delete", "PromoCode", params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/promo-codes] DELETE failed", { id: params.id, email: s.email, error });
    return NextResponse.json({ error: "Failed to delete promo code" }, { status: 500 });
  }
}
