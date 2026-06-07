import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentDelegate } from "@/lib/delegateSession";
import { releaseHoldByRegistration } from "@/lib/portfolios";
import { promoteFromWaitlist } from "@/lib/waitlistPromotion";
export const runtime = "nodejs";

export async function POST() {
  const reg = await currentDelegate();
  if (!reg) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (reg.status === "CANCELLED") return NextResponse.json({ ok: true, already: true });

  const wasPaid = reg.status === "PAID";
  await prisma.registration.update({ where: { id: reg.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });

  // Free any hold + assigned portfolio so the seat reopens
  await releaseHoldByRegistration(reg.id);
  await prisma.portfolio.updateMany({ where: { assignedTo: reg.id }, data: { status: "AVAILABLE", assignedTo: null } });

  // A paid seat opening up triggers waitlist promotion for that committee
  let promoted = false;
  if (wasPaid) promoted = (await promoteFromWaitlist(reg.trackSlug)).promoted;

  return NextResponse.json({ ok: true, refundNote: wasPaid, promoted });
}
