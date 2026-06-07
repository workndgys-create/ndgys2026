export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail, templates } from "@/lib/email";
import { env } from "@/lib/env";
export const runtime = "nodejs";

/**
 * Emails a "complete your registration" nudge to delegates who started but didn't pay.
 * Targets PENDING rows older than 1h and younger than 24h that haven't been nudged.
 * Call on a schedule (e.g. hourly cron). Idempotent via the nudgedAt stamp.
 */
export async function GET() {
  const now = Date.now();
  const candidates = await prisma.registration.findMany({
    where: {
      status: "PENDING",
      nudgedAt: null,
      gatewayPaymentId: null,
      createdAt: { lt: new Date(now - 60 * 60 * 1000), gt: new Date(now - 24 * 60 * 60 * 1000) }
    },
    take: 100
  });

  let sent = 0;
  for (const reg of candidates) {
    const link = `${env.NEXT_PUBLIC_BASE_URL}/register?track=${reg.trackSlug}`;
    const res = await sendMail({ to: reg.email, subject: "Complete your Summit registration", html: templates.abandonedRegistration(reg.fullName, reg.trackName, link) });
    await prisma.registration.update({ where: { id: reg.id }, data: { nudgedAt: new Date() } });
    if (res.sent) sent++;
  }
  return NextResponse.json({ ok: true, candidates: candidates.length, sent });
}
