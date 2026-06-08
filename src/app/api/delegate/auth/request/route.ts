import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDelegateSession, delegateCookieName, delegateCookieOptions } from "@/lib/delegateAuth";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { z } from "zod";

export const runtime = "nodejs";
const schema = z.object({ email: z.string().trim().email() });

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`dlgreq:${ip}`, 5, 300).ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email." }, { status: 422 });
  const email = parsed.data.email.toLowerCase();

  if (!rateLimit(`dlgreq-email:${email}`, 4, 900).ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  // Panel access is granted only after payment.
  const paid = await prisma.registration.findFirst({ where: { email, status: "PAID" } });
  if (paid) {
    const token = await createDelegateSession({ email });
    const res = NextResponse.json({ ok: true, authenticated: true });
    res.cookies.set(delegateCookieName, token, delegateCookieOptions);
    return res;
  }

  return NextResponse.json({ ok: false, error: "This email is not eligible for delegate login. Use the email from a successfully paid registration." }, { status: 403 });
}
