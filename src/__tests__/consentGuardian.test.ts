import { describe, it, expect } from "vitest";
import { registrationSchema, competitionRegistrationSchema, delegationSchema } from "@/lib/validation";

const reg = { fullName: "Aanya Rao", email: "a@b.com", phone: "9876543210", track: "climate" };

describe("guardian consent for minors", () => {
  it("under-18 registration requires guardian name, phone and consent", () => {
    const r = registrationSchema.safeParse({ ...reg, age: "15", consentAccepted: true });
    expect(r.success).toBe(false);
  });
  it("under-18 registration passes with full guardian details", () => {
    const r = registrationSchema.safeParse({ ...reg, age: "15", consentAccepted: true, guardianName: "Mr Rao", guardianPhone: "9811111111", guardianConsent: true });
    expect(r.success).toBe(true);
  });
  it("adults need no guardian", () => {
    const r = registrationSchema.safeParse({ ...reg, age: "21", consentAccepted: true });
    expect(r.success).toBe(true);
  });
  it("competition under-18 requires guardian consent", () => {
    const base = { competitionId: "c1", leaderName: "Asha", email: "a@b.com", phone: "9876543210", participation: "SOLO", members: [], age: "16", consentAccepted: true };
    expect(competitionRegistrationSchema.safeParse(base).success).toBe(false);
    expect(competitionRegistrationSchema.safeParse({ ...base, guardianName: "P", guardianPhone: "9811111111", guardianConsent: true }).success).toBe(true);
  });
  it("delegation accepts coordinator consent flag", () => {
    const d = delegationSchema.safeParse({ schoolName: "DPS", headName: "Head", email: "h@s.edu", phone: "9876543210", members: [{ fullName: "Ravi K", email: "ravi@k.com", age: 20, track: "climate" }], consentAccepted: true });
    expect(d.success).toBe(true);
  });
});
