import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import { env } from "./env";

const COOKIE = "ndgys_delegate";
const secret = () => new TextEncoder().encode(env.JWT_SECRET + ":delegate");

export type DelegateSession = { email: string };

export async function createDelegateSession(p: DelegateSession): Promise<string> {
  return new SignJWT({ email: p.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyDelegateSession(token: string): Promise<DelegateSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return { email: String(payload.email) };
  } catch {
    return null;
  }
}

// ── Magic-link / OTP token primitives ──────────────────────────────
export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
export function generateOtp(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}
export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
export function tokensMatch(raw: string, hash: string): boolean {
  const a = Buffer.from(hashToken(raw));
  const b = Buffer.from(hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const delegateCookieName = COOKIE;
export const delegateCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7
};
