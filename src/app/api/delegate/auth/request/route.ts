import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDelegateSession, delegateCookieName, delegateCookieOptions } from "@/lib/delegateAuth";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { z } from "zod";

export const runtime = "nodejs";
const schema = z.object({ email: z.string().trim().email() });
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(
      await req.json().catch(() => null)
    );

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
        status: "PAID",
      },
    });

    const compPaid =
      await prisma.competitionRegistration.findFirst({
        where: {
          email,
          status: "PAID",
        },
      });

    if (paid || compPaid) {
      const token = await createDelegateSession({
        email,
      });

      const res = NextResponse.json({
        ok: true,
        authenticated: true,
      });

      res.cookies.set(
        delegateCookieName,
        token,
        delegateCookieOptions
      );

      return res;
    }

    // ← THIS WAS MISSING
    return NextResponse.json(
      {
        ok: false,
        error:
          "This email is not eligible for login. Use the email from a successfully paid registration or competition entry.",
      },
      { status: 403 }
    );
  } catch (e) {
    console.error(e);

    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

    
