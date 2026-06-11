import { describe, it, expect } from "vitest";
import { qrPayload, qrDataUrl, qrPngBuffer } from "@/lib/qr";

describe("qr", () => {
  it("encodes a verify URL containing the delegate id", () => {
    const p = qrPayload("NDGYS-2026-AB12");
    expect(p).toContain("/verify/");
    expect(p).toContain("NDGYS-2026-AB12");
  });
  it("produces a PNG data URL", async () => {
    const url = await qrDataUrl("NDGYS-2026-AB12");
    expect(url.startsWith("data:image/png;base64,")).toBe(true);
  });
  it("produces a non-empty PNG buffer with the PNG signature", async () => {
    const buf = await qrPngBuffer("NDGYS-2026-AB12");
    expect(buf.length).toBeGreaterThan(100);
    // PNG magic number
    expect(buf.subarray(0, 4).toString("hex")).toBe("89504e47");
  });
});
