import { describe, it, expect } from "vitest";
import { applyPromo } from "@/lib/promo";

const future = new Date(Date.now() + 86400000).toISOString();
const past = new Date(Date.now() - 86400000).toISOString();

describe("applyPromo", () => {
  it("applies a percentage discount and rounds to paise", () => {
    const r = applyPromo({ kind: "PERCENT", value: 10 }, 250000);
    expect(r.ok && r.discount).toBe(25000);
    expect(r.ok && r.final).toBe(225000);
  });
  it("applies a flat discount capped at the base amount", () => {
    const r = applyPromo({ kind: "FLAT", value: 300000 }, 250000);
    expect(r.ok && r.discount).toBe(250000);
    expect(r.ok && r.final).toBe(0);
  });
  it("rejects an inactive code", () => {
    const r = applyPromo({ kind: "PERCENT", value: 10, active: false }, 250000);
    expect(r.ok).toBe(false); if (!r.ok) expect(r.reason).toBe("inactive");
  });
  it("rejects an expired code", () => {
    const r = applyPromo({ kind: "PERCENT", value: 10, expiresAt: past }, 250000);
    expect(r.ok).toBe(false); if (!r.ok) expect(r.reason).toBe("expired");
  });
  it("accepts a code that has not yet expired", () => {
    expect(applyPromo({ kind: "PERCENT", value: 10, expiresAt: future }, 250000).ok).toBe(true);
  });
  it("rejects a used-up code", () => {
    const r = applyPromo({ kind: "PERCENT", value: 10, maxUses: 5, uses: 5 }, 250000);
    expect(r.ok).toBe(false); if (!r.ok) expect(r.reason).toBe("used_up");
  });
  it("rejects a code scoped to a different committee", () => {
    const r = applyPromo({ kind: "PERCENT", value: 10, appliesTo: "climate" }, 250000, "crisis");
    expect(r.ok).toBe(false); if (!r.ok) expect(r.reason).toBe("not_applicable");
  });
  it("honours a percentage clamp at 100", () => {
    const r = applyPromo({ kind: "PERCENT", value: 150 }, 250000);
    expect(r.ok && r.final).toBe(0);
  });
  it("returns invalid for a missing promo", () => {
    const r = applyPromo(null, 250000);
    expect(r.ok).toBe(false); if (!r.ok) expect(r.reason).toBe("invalid");
  });
});
