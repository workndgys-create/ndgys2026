import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDelegateSession, delegateCookieName, delegateCookieOptions } from "@/lib/delegateAuth";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { z } from "zod";

export const runtime = "nodejs";
const schema = z.object({ email: z.string().trim().email() });
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 422 }
      );
    }

    const email = parsed.data.email.toLowerCase();

    const paid = await prisma.registration.findFirst({
      where: {
        email,
        status: "PAID"
      }
    });

    const compPaid = await prisma.competitionRegistration.findFirst({
      where: {
        email,
        status: "PAID"
      }
    });

    return NextResponse.json({
      email,
      munFound: !!paid,
      compFound: !!compPaid,
      compData: compPaid,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: e.message,
        stack: String(e.stack),
      },
      { status: 500 }
    );
  }
}
