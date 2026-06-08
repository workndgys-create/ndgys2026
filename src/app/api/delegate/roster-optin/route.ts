import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentDelegate } from "@/lib/delegateSession";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const me = await currentDelegate();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  await prisma.registration.update({ where: { id: me.id }, data: { rosterOptIn: !!b.optIn } });
  return NextResponse.json({ ok: true, optIn: !!b.optIn });
}
