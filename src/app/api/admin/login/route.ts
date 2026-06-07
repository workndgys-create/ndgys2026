import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { adminLoginSchema } from "@/lib/validation";
import { createSessionToken, sessionCookieName, cookieOptions, AdminRole } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!rateLimit(`adminlogin:${clientIp(req.headers)}`, 8, 300).ok) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });

  const parsed = adminLoginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid credentials" }, { status: 422 });

  const user = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.active || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const token = await createSessionToken({ sub: user.id, email: user.email, role: user.role as AdminRole });
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(sessionCookieName, token, cookieOptions);
  return res;
}
