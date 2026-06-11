import { describe, it, expect } from "vitest";
import { competitionRegistrationSchema } from "@/lib/validation";

const base = { competitionId: "c1", leaderName: "Asha Verma", email: "a@b.com", phone: "9876543210" };

describe("competitionRegistrationSchema", () => {
  it("accepts a valid solo entry", () => {
    expect(competitionRegistrationSchema.safeParse({ ...base, participation: "SOLO", members: [] }).success).toBe(true);
  });
  it("requires a team name for group entries", () => {
    const r = competitionRegistrationSchema.safeParse({ ...base, participation: "GROUP", members: [{ name: "Ravi" }] });
    expect(r.success).toBe(false);
  });
  it("requires at least one member for group entries", () => {
    const r = competitionRegistrationSchema.safeParse({ ...base, participation: "GROUP", teamName: "Phoenix", members: [] });
    expect(r.success).toBe(false);
  });
  it("accepts a valid group entry", () => {
    const r = competitionRegistrationSchema.safeParse({ ...base, participation: "GROUP", teamName: "Phoenix", members: [{ name: "Ravi", age: 17 }, { name: "Sara" }] });
    expect(r.success).toBe(true);
  });
});
