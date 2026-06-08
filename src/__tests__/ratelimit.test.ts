import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, __resetRateLimit, clientIp } from "@/lib/ratelimit";

describe("rateLimit", () => {
  beforeEach(() => __resetRateLimit());

  it("allows up to the limit then blocks", () => {
    let blocked = 0;
    for (let i = 0; i < 7; i++) if (!rateLimit("k", 5, 60).ok) blocked++;
    expect(blocked).toBe(2);
  });
  it("tracks keys independently", () => {
    for (let i = 0; i < 5; i++) rateLimit("a", 5, 60);
    expect(rateLimit("a", 5, 60).ok).toBe(false);
    expect(rateLimit("b", 5, 60).ok).toBe(true);
  });
  it("returns a retryAfter when blocked", () => {
    for (let i = 0; i < 5; i++) rateLimit("c", 5, 60);
    const r = rateLimit("c", 5, 60);
    expect(r.ok).toBe(false);
    expect(r.retryAfter).toBeGreaterThan(0);
  });
});

describe("clientIp", () => {
  it("reads x-forwarded-for first", () => {
    const h = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(clientIp(h)).toBe("1.2.3.4");
  });
  it("falls back to unknown", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
