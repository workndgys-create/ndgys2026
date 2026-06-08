import { describe, it, expect } from "vitest";
import { feeForParticipation, validateTeam } from "@/lib/competitionRules";

describe("feeForParticipation", () => {
  it("solo competition: solo fee, no group", () => {
    expect(feeForParticipation({ format: "SOLO", feeSolo: 300 }, "SOLO")).toBe(300);
    expect(feeForParticipation({ format: "SOLO", feeSolo: 300 }, "GROUP")).toBeNull();
  });
  it("group competition: group fee, no solo", () => {
    expect(feeForParticipation({ format: "GROUP", feeGroup: 1200 }, "GROUP")).toBe(1200);
    expect(feeForParticipation({ format: "GROUP", feeGroup: 1200 }, "SOLO")).toBeNull();
  });
  it("both: each side returns its own fee", () => {
    const c = { format: "BOTH" as const, feeSolo: 400, feeGroup: 1500 };
    expect(feeForParticipation(c, "SOLO")).toBe(400);
    expect(feeForParticipation(c, "GROUP")).toBe(1500);
  });
});

describe("validateTeam", () => {
  const group = { format: "GROUP" as const, minTeam: 3, maxTeam: 8 };
  it("rejects solo on a group-only competition", () => {
    expect(validateTeam(group, "SOLO", 1).ok).toBe(false);
  });
  it("enforces the minimum team size", () => {
    const r = validateTeam(group, "GROUP", 2);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/at least 3/);
  });
  it("enforces the maximum team size", () => {
    const r = validateTeam(group, "GROUP", 9);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/at most 8/);
  });
  it("accepts a valid team", () => {
    expect(validateTeam(group, "GROUP", 5).ok).toBe(true);
  });
  it("rejects group on a solo-only competition", () => {
    expect(validateTeam({ format: "SOLO" }, "GROUP", 4).ok).toBe(false);
  });
});
