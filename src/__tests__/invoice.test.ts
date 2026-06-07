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
      trackName: "Global Policy Dialogue",
      amount: 250000
    });
    expect(pdf.length).toBeGreaterThan(800);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
