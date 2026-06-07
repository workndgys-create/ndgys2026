import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin, audit } from "@/lib/adminSession";
export const runtime = "nodejs";
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const updated = await prisma.contactMessage.update({ where: { id: params.id }, data: { handled: !!body.handled } });
  await audit(admin.email, "message.handled", "ContactMessage", params.id, String(!!body.handled));
  return NextResponse.json({ ok: true, message: updated });
}
