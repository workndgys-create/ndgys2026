import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

const COOKIE = "ndgys_admin";
const secret = () => new TextEncoder().encode(env.JWT_SECRET);

export type AdminRole =
  | "SUPER_ADMIN"
  | "DIRECTOR"
  | "HR"
  | "DEVELOPER"
  | "FINANCE_LEAD"
  | "FINANCE_EXECUTIVE"
  | "DELEGATE_AFFAIRS_LEAD"
  | "DELEGATE_AFFAIRS_EXECUTIVE"
  | "VOLUNTEER_COORDINATOR"
  | "VOLUNTEER";
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

export function roleAtLeast(
  role: AdminRole,
  min: AdminRole
): boolean {
  const rank: Record<AdminRole, number> = {
    VOLUNTEER: 1,
    VOLUNTEER_COORDINATOR: 2,

    DELEGATE_AFFAIRS_EXECUTIVE: 3,
    DELEGATE_AFFAIRS_LEAD: 4,

    FINANCE_EXECUTIVE: 5,
    FINANCE_LEAD: 6,

    HR: 7,

    DEVELOPER: 8,

    DIRECTOR: 9,

    SUPER_ADMIN: 10
  };

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
