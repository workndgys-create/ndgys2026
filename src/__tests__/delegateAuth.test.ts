// @vitest-environment node
import { describe, it, expect } from "vitest";
import { generateRawToken, generateOtp, hashToken, tokensMatch, createDelegateSession, verifyDelegateSession } from "@/lib/delegateAuth";

describe("delegate token primitives", () => {
  it("generates a 6-digit OTP", () => {
    for (let i = 0; i < 50; i++) expect(generateOtp()).toMatch(/^\d{6}$/);
  });
  it("generates distinct 64-char hex tokens", () => {
    const a = generateRawToken(), b = generateRawToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });
  it("hash/compare is correct and constant-shape", () => {
    const raw = generateRawToken();
    const h = hashToken(raw);
    expect(tokensMatch(raw, h)).toBe(true);
    expect(tokensMatch("wrong", h)).toBe(false);
  });
});

describe("delegate session JWT", () => {
  it("round-trips an email", async () => {
    const token = await createDelegateSession({ email: "a@b.com" });
    const session = await verifyDelegateSession(token);
    expect(session?.email).toBe("a@b.com");
  });
  it("rejects a tampered token", async () => {
    const token = await createDelegateSession({ email: "a@b.com" });
    expect(await verifyDelegateSession(token + "x")).toBeNull();
  });
});
