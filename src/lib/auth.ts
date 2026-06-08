import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

const COOKIE = "ndgys_admin";
const secret = () => new TextEncoder().encode(env.JWT_SECRET);

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "VIEWER";
export type AdminSession = { sub: string; email: string; role: AdminRole };

export async function createSessionToken(p: AdminSession): Promise<string> {
  return new SignJWT({ email: p.email, role: p.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return { sub: String(payload.sub), email: String(payload.email), role: payload.role as AdminRole };
  } catch {
    return null;
  }
}

/** Role hierarchy check. SUPER_ADMIN > ADMIN > VIEWER. */
export function roleAtLeast(role: AdminRole, min: AdminRole): boolean {
  const rank: Record<AdminRole, number> = { VIEWER: 1, ADMIN: 2, SUPER_ADMIN: 3 };
  return rank[role] >= rank[min];
}

export const sessionCookieName = COOKIE;
export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 8
};
