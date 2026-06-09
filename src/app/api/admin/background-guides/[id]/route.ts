import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";
export const runtime = "nodejs";
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requirePermission("content.manage");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.backgroundGuide.delete({ where: { id: params.id } });
  await audit(s.email, "bgguide.delete", "BackgroundGuide", params.id);
  return NextResponse.json({ ok: true });
}
