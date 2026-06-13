import { describe, it, expect } from "vitest";
import { generateInvoicePdf } from "@/lib/invoice";

describe("generateInvoicePdf", () => {
  it("renders a valid, non-trivial PDF buffer", async () => {
    const pdf = await generateInvoicePdf({
      number: "NDGYS/2026/0001",
      issuedAt: new Date("2026-06-01T00:00:00Z"),
      delegateId: "NDGYS-2026-AB12",
      fullName: "Aanya Rao",
      email: "aanya@example.com",
      trackName: "United Nations Security Council",
      amount: 250000
    });
    expect(pdf.length).toBeGreaterThan(800);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("renders with a custom itemTitle successfully", async () => {
    const pdf = await generateInvoicePdf({
      number: "NDGYS/2026/C-S26Q",
      issuedAt: new Date("2026-06-01T00:00:00Z"),
      delegateId: "NDGYS-C-2026-S26Q",
      fullName: "Aanya Rao",
      email: "aanya@example.com",
      trackName: "Battle of Bands",
      amount: 400,
      itemTitle: "Competition Registration — Battle of Bands"
    });
    expect(pdf.length).toBeGreaterThan(800);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
