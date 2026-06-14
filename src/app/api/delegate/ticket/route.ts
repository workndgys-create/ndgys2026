import { NextResponse } from "next/server";
import { currentDelegate } from "@/lib/delegateSession";
import { qrDataUrl } from "@/lib/qr";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const reg = await currentDelegate();

  if (!reg)
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );

  if (!reg.delegateId)
    return NextResponse.json(
      { error: "Ticket available after payment" },
      { status: 409 }
    );

  if ((reg as any).isCompetition) {
    const compReg = await prisma.competitionRegistration.findUnique({ where: { id: reg.id } });
    if (!compReg) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const photos = await prisma.competitionPhoto.findMany({
      where: { competitionRegistrationId: reg.id },
      select: { memberIndex: true }
    });
    const photoIndices = new Set(photos.map((p) => p.memberIndex));

    let membersList: any[] = [];
if (typeof compReg.members === "string") {
  try { membersList = compReg.members.trim() ? JSON.parse(compReg.members) : []; } catch { membersList = []; }
} else if (Array.isArray(compReg.members)) { membersList = compReg.members; }
    const membersWithQrs = await Promise.all(
      membersList.map(async (m: any, idx: number) => {
        const mId = m.participantId || `${compReg.refId}-${String(idx + 1).padStart(2, "0")}`;
        return {
          name: m.name,
          age: m.age,
          delegateId: mId,
          qr: await qrDataUrl(mId),
          hasPhoto: photoIndices.has(idx + 1)
        };
      })
    );

    return NextResponse.json({
      id: reg.id,
      delegateId: reg.delegateId,
      fullName: reg.fullName,
      trackName: reg.trackName,
      qr: await qrDataUrl(reg.delegateId),
      hasPhoto: photoIndices.has(0),
      isCompetition: true,
      members: membersWithQrs
    }, { headers: { "Cache-Control": "no-store, private" } });

  const photo = await prisma.registrationPhoto.findUnique({
    where: { registrationId: reg.id },
    select: { id: true },
  });

  return NextResponse.json({
    id: reg.id,
    delegateId: reg.delegateId,
    fullName: reg.fullName,
    trackName: reg.trackName,
    qr: await qrDataUrl(reg.delegateId),
    hasPhoto: !!photo,
    isCompetition: false,
  });
}
