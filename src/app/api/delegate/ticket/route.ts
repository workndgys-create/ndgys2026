import { NextResponse } from "next/server";
import { currentDelegate } from "@/lib/delegateSession";
import { qrDataUrl } from "@/lib/qr";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const reg = await currentDelegate();
  if (!reg) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!reg.delegateId) return NextResponse.json({ error: "Ticket available after payment" }, { status: 409 });

  const photo =
  (reg as any).isCompetition
    ? null
    : await 
  prisma.registrationPhoto.findUnique({
        where: { registrationId: reg.id },
        select: { id: true }
      });

  return NextResponse.json({
    id: reg.id,
    delegateId: reg.delegateId,
    fullName: reg.fullName,
    trackName: reg.trackName,
    qr: await qrDataUrl(reg.delegateId),
    hasPhoto: !!photo,
    isCompetition: !!(reg as any).isCompetition
  });
}
