import { describe, it, expect } from "vitest";
import { registrationSchema, contactSchema, seedTrackBySlug, TRACKS } from "@/lib/validation";

describe("registrationSchema", () => {
  const base = { fullName: "Aanya Rao", email: "a@b.com", phone: "+91 9876543210", track: TRACKS[0].slug, institution: "Delhi Public School" };
  it("accepts a valid registration", () => expect(registrationSchema.safeParse(base).success).toBe(true));
  it("rejects a short name", () => expect(registrationSchema.safeParse({ ...base, fullName: "A" }).success).toBe(false));
  it("rejects a bad email", () => expect(registrationSchema.safeParse({ ...base, email: "nope" }).success).toBe(false));
  it("rejects an invalid phone", () => expect(registrationSchema.safeParse({ ...base, phone: "abc" }).success).toBe(false));
  it("rejects when honeypot is filled", () => expect(registrationSchema.safeParse({ ...base, company: "bot" }).success).toBe(false));
  it("requires age 12-16 only for UNEP and AIPPM", () => {
    expect(registrationSchema.safeParse({ ...base, track: "aippm" }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...base, track: "unep" }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...base, track: "aippm", age: 11 }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...base, track: "aippm", age: 17 }).success).toBe(false);
    const minorConsent = { guardianName: "Parent", guardianPhone: "9811111111", guardianConsent: true };
    expect(registrationSchema.safeParse({ ...base, track: "aippm", age: 12, ...minorConsent }).success).toBe(true);
    expect(registrationSchema.safeParse({ ...base, track: "aippm", age: 16, ...minorConsent }).success).toBe(true);
    expect(registrationSchema.safeParse({ ...base, track: "lok-sabha" }).success).toBe(true);
  });
});

describe("contactSchema", () => {
  it("requires a reasonable message", () =>
    expect(contactSchema.safeParse({ fullName: "Ravi", email: "r@x.com", subject: "Other", message: "short" }).success).toBe(false));
  it("accepts a valid message", () =>
    expect(contactSchema.safeParse({ fullName: "Ravi Kumar", email: "r@x.com", subject: "General Enquiry", message: "I would like details about the climate track please." }).success).toBe(true));
});

describe("seedTrackBySlug", () => {
  it("resolves a known slug with rupee fee", () => {
    const t = seedTrackBySlug(TRACKS[0].slug)!;
    expect(t.fee).toBeGreaterThan(0);
    expect(t.name.length).toBeGreaterThan(3);
  });
  it("returns undefined for unknown slugs", () => expect(seedTrackBySlug("nope")).toBeUndefined());
});
