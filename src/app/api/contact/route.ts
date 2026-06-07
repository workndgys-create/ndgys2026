import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validation";
import { sendMail, templates } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rl = rateLimit(`contact:${clientIp(req.headers)}`, 5, 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many messages. Try again shortly." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });

  const parsed = contactSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  const d = parsed.data;
  if (d.company) return NextResponse.json({ ok: true }); // honeypot

  await prisma.contactMessage.create({
    data: { fullName: d.fullName, email: d.email, phone: d.phone || null, subject: d.subject, message: d.message }
  });
  if (env.MAIL_ADMIN_TO) {
    await sendMail({ to: env.MAIL_ADMIN_TO, subject: `Contact: ${d.subject} — ${d.fullName}`, html: templates.adminNewContact(d.fullName, d.email, d.subject, d.message) });
  }
  return NextResponse.json({ ok: true });
}
