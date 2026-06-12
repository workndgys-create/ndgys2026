import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentDelegate } from "@/lib/delegateSession";
import { profileSchema } from "@/lib/validation";
export const runtime = "nodejs";
export async function PATCH(req: NextRequest) {
  const reg = await currentDelegate();
  if (!reg) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = profileSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  const d = parsed.data;
  if (reg.isCompetition) {
    return NextResponse.json({ ok: true });
  }
  await prisma.registration.update({
    where: { id: reg.id },
    data: { dietary: d.dietary || null, accessibility: d.accessibility || null }
  });
  return NextResponse.json({ ok: true });
}
