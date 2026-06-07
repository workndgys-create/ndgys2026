import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tokensMatch, createDelegateSession, delegateCookieName, delegateCookieOptions } from "@/lib/delegateAuth";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { z } from "zod";

export const runtime = "nodejs";
const schema = z.object({
  email: z.string().trim().email(),
  token: z.string().optional(),
  otp: z.string().optional()
}).refine((d) => d.token || d.otp, "Provide a token or OTP");

export async function POST(req: NextRequest) {
  if (!rateLimit(`dlgverify:${clientIp(req.headers)}`, 10, 300).ok) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  const email = parsed.data.email.toLowerCase();

  const candidates = await prisma.magicLinkToken.findMany({
    where: { email, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const match = candidates.find((c: { tokenHash: string; otpHash: string }) =>
    parsed.data.token ? tokensMatch(parsed.data.token, c.tokenHash) : parsed.data.otp ? tokensMatch(parsed.data.otp, c.otpHash) : false
  );
  if (!match) return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });

  await prisma.magicLinkToken.update({ where: { id: match.id }, data: { usedAt: new Date() } });

  const token = await createDelegateSession({ email });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(delegateCookieName, token, delegateCookieOptions);
  return res;
}
