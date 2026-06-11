import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail, templates } from "@/lib/email";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const now = Date.now();

    const candidates = await prisma.registration.findMany({
      where: {
        status: "PENDING",
        nudgedAt: null,
        gatewayPaymentId: null,
        createdAt: {
          lt: new Date(now - 60 * 60 * 1000),
          gt: new Date(now - 24 * 60 * 60 * 1000),
        },
      },
      take: 100,
    });

    let sent = 0;

    for (const reg of candidates) {
      try {
        const link = `${env.NEXT_PUBLIC_BASE_URL}/register?track=${reg.trackSlug}`;

        const result = await sendMail({
          to: reg.email,
          subject: "Complete your Summit registration",
          html: templates.abandonedRegistration(
            reg.fullName,
            reg.trackName,
            link
          ),
        });

        await prisma.registration.update({
          where: { id: reg.id },
          data: { nudgedAt: new Date() },
        });

        if (result?.sent) sent++;
      } catch (mailError) {
        console.error(mailError);
      }
    }

    return NextResponse.json({
      ok: true,
      candidates: candidates.length,
      sent,
    });
  } catch (error) {
    console.error("abandonment-nudge failed", error);

    return NextResponse.json({
      ok: false,
      candidates: 0,
      sent: 0,
    });
  }
}
