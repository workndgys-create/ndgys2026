import { describe, it, expect } from "vitest";
import { generateBadgePdf, generateBadgeSheet } from "@/lib/badge";

const d = { delegateId: "NDGYS-2026-AB12", fullName: "Aanya Rao", trackName: "Global Policy Dialogue", trackSlug: "global-policy", portfolio: "France" };

describe("badge PDFs", () => {
  it("single badge is a valid PDF", async () => {
    const pdf = await generateBadgePdf(d);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(800);
  });
  it("bulk sheet is a valid, larger PDF for multiple delegates", async () => {
    const sheet = await generateBadgeSheet([d, { ...d, delegateId: "NDGYS-2026-CD34", fullName: "Rohan Mehta", portfolio: "Brazil" }]);
    expect(sheet.subarray(0, 5).toString()).toBe("%PDF-");
    expect(sheet.length).toBeGreaterThan(1500);
  });
  it("bulk sheet still renders with an empty list", async () => {
    const sheet = await generateBadgeSheet([]);
    expect(sheet.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
