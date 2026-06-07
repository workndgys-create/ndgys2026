import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRawToken, generateOtp, hashToken } from "@/lib/delegateAuth";
import { sendMail, templates } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { env } from "@/lib/env";
import { z } from "zod";

export const runtime = "nodejs";
const schema = z.object({ email: z.string().trim().email() });
const GENERIC = { ok: true, message: "If that email is registered, a sign-in link is on its way." };

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`dlgreq:${ip}`, 5, 300).ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(GENERIC); // don't reveal validity
  const email = parsed.data.email.toLowerCase();

  if (!rateLimit(`dlgreq-email:${email}`, 4, 900).ok) return NextResponse.json(GENERIC);

  // Panel access is granted only after payment, so only PAID registrations get a link.
  const paid = await prisma.registration.findFirst({ where: { email, status: "PAID" } });
  if (paid) {
    const raw = generateRawToken();
    const otp = generateOtp();
    await prisma.magicLinkToken.create({
      data: { email, tokenHash: hashToken(raw), otpHash: hashToken(otp), expiresAt: new Date(Date.now() + 15 * 60 * 1000) }
    });
    const link = `${env.NEXT_PUBLIC_BASE_URL}/dashboard/login?token=${raw}&email=${encodeURIComponent(email)}`;
    await sendMail({ to: email, subject: "Your sign-in link", html: templates.magicLink(link, otp) });
    return NextResponse.json(GENERIC);
  }

  // Registered but not yet paid → tell them the panel unlocks after payment.
  const pending = await prisma.registration.findFirst({ where: { email } });
  if (pending) {
    return NextResponse.json({ ok: true, pending: true, message: "We found your registration, but it isn't confirmed yet. Your delegate panel unlocks once your payment is complete." });
  }
  return NextResponse.json(GENERIC);
}
