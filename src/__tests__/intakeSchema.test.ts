import { describe, it, expect } from "vitest";
import { registrationSchema, competitionRegistrationSchema } from "@/lib/validation";

describe("registration intake fields", () => {
  const base = { fullName: "Aanya Rao", email: "a@b.com", phone: "+91 9876543210", track: "climate", institution: "Delhi Public School", age: 20 };
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
  it("still accepts a minimal form (new fields optional except institution)", () => {
    expect(registrationSchema.safeParse(base).success).toBe(true);
  });
  it("requires detail when heard source is friend/word of mouth", () => {
    expect(registrationSchema.safeParse({ ...base, howHeard: "Friend / Word of mouth" }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...base, howHeard: "Friend / Word of mouth", howHeardDetail: "Senior from school" }).success).toBe(true);
  });
});

describe("competition intake fields", () => {
  const base = { competitionId: "c1", leaderName: "Asha Verma", email: "a@b.com", phone: "9876543210", institution: "City College", age: 20 };
  it("accepts a solo entry with intake details", () => {
    const r = competitionRegistrationSchema.safeParse({ ...base, participation: "SOLO", members: [], city: "Pune", gender: "male", emergencyContact: "9000000000", howHeard: "WhatsApp" });
    expect(r.success).toBe(true);
  });
  it("accepts a team entry with past experience", () => {
    const r = competitionRegistrationSchema.safeParse({ ...base, participation: "GROUP", teamName: "Phoenix", members: [{ name: "Ravi", age: 18 }, { name: "Sara", age: 18 }], pastExperience: "Won state finals 2025", emergencyContact: "9000000000" });
    expect(r.success).toBe(true);
  });
  it("requires detail when heard source is other", () => {
    expect(competitionRegistrationSchema.safeParse({ ...base, participation: "SOLO", members: [], howHeard: "Other" }).success).toBe(false);
    expect(competitionRegistrationSchema.safeParse({ ...base, participation: "SOLO", members: [], howHeard: "Other", howHeardDetail: "Community newsletter" }).success).toBe(true);
  });
});
