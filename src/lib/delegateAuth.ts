import { SignJWT, jwtVerify } from "jose";
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
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateRawToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export function generateOtp(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(bytes[0] % 1_000_000).padStart(6, "0");
}

export async function hashToken(raw: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return toHex(new Uint8Array(digest));
}

export async function tokensMatch(raw: string, hash: string): Promise<boolean> {
  const calculated = await hashToken(raw);
  if (calculated.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < calculated.length; i++) {
    diff |= calculated.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}

export const delegateCookieName = COOKIE;
export const delegateCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7
};
