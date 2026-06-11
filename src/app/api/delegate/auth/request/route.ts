import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDelegateSession, delegateCookieName, delegateCookieOptions } from "@/lib/delegateAuth";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { z } from "zod";

export const runtime = "nodejs";
const schema = z.object({ email: z.string().trim().email() });

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
const parsed = schema.safeParse(await req.json().catch(() => null));

if (!parsed.success) {
  return NextResponse.json({
    debug: "validation failed"
  });
}

const email = parsed.data.email.toLowerCase();

const paid = await prisma.registration.findFirst({
  where: { email, status: "PAID" }
});

const compPaid = !paid
  ? await prisma.competitionRegistration.findFirst({
      where: { email, status: "PAID" }
    })
  : null;

return NextResponse.json({
  email,
  paid: !!paid,
  compPaid: !!compPaid
});
