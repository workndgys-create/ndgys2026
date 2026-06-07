import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { waitlistSchema } from "@/lib/validation";
import { sendMail, templates } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rl = rateLimit(`waitlist:${clientIp(req.headers)}`, 5, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });

  const parsed = waitlistSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  const { fullName, email, track } = parsed.data;

  const t = await prisma.track.findUnique({ where: { slug: track } });
  await prisma.waitlist.create({ data: { name: fullName, email, trackSlug: track } });
  await sendMail({ to: email, subject: "You're on the waitlist", html: templates.waitlistConfirm(fullName, t?.name || track) });
  return NextResponse.json({ ok: true });
}
