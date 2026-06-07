import { describe, it, expect } from "vitest";
import { feeForParticipation, validateTeam } from "@/lib/competitionRules";

describe("feeForParticipation", () => {
  it("solo competition: solo fee, no group", () => {
    expect(feeForParticipation({ format: "SOLO", feeSolo: 30000 }, "SOLO")).toBe(30000);
    expect(feeForParticipation({ format: "SOLO", feeSolo: 30000 }, "GROUP")).toBeNull();
  });
  it("group competition: group fee, no solo", () => {
    expect(feeForParticipation({ format: "GROUP", feeGroup: 120000 }, "GROUP")).toBe(120000);
    expect(feeForParticipation({ format: "GROUP", feeGroup: 120000 }, "SOLO")).toBeNull();
  });
  it("both: each side returns its own fee", () => {
    const c = { format: "BOTH" as const, feeSolo: 40000, feeGroup: 150000 };
    expect(feeForParticipation(c, "SOLO")).toBe(40000);
    expect(feeForParticipation(c, "GROUP")).toBe(150000);
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
