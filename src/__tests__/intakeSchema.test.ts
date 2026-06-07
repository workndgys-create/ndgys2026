import { describe, it, expect } from "vitest";
import { registrationSchema, competitionRegistrationSchema } from "@/lib/validation";

describe("registration intake fields", () => {
  const base = { fullName: "Aanya Rao", email: "a@b.com", phone: "+91 9876543210", track: "climate" };
  it("accepts the full intake form", () => {
    const r = registrationSchema.safeParse({ ...base, age: "19", city: "Delhi", gender: "female", emergencyContact: "9876500000", howHeard: "Instagram", notes: "Excited!" });
    expect(r.success).toBe(true);
  });
  it("coerces age to a number", () => {
    const r = registrationSchema.safeParse({ ...base, age: "20" });
    expect(r.success && r.data.age).toBe(20);
  });
  it("rejects an out-of-range age", () => {
    expect(registrationSchema.safeParse({ ...base, age: "200" }).success).toBe(false);
  });
  it("rejects a bad emergency contact", () => {
    expect(registrationSchema.safeParse({ ...base, emergencyContact: "nope" }).success).toBe(false);
  });
  it("still accepts a minimal form (new fields optional)", () => {
    expect(registrationSchema.safeParse(base).success).toBe(true);
  });
});

describe("competition intake fields", () => {
  const base = { competitionId: "c1", leaderName: "Asha Verma", email: "a@b.com", phone: "9876543210" };
  it("accepts a solo entry with intake details", () => {
    const r = competitionRegistrationSchema.safeParse({ ...base, participation: "SOLO", members: [], age: "19", city: "Pune", gender: "male", emergencyContact: "9000000000", howHeard: "WhatsApp" });
    expect(r.success).toBe(true);
  });
  it("accepts a team entry with past experience", () => {
    const r = competitionRegistrationSchema.safeParse({ ...base, participation: "GROUP", teamName: "Phoenix", members: [{ name: "Ravi" }, { name: "Sara" }], pastExperience: "Won state finals 2025", emergencyContact: "9000000000" });
    expect(r.success).toBe(true);
  });
});
