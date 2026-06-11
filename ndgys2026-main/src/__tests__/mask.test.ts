import { describe, it, expect } from "vitest";
import { maskName } from "@/lib/names";

describe("maskName", () => {
  it("masks a full name to first + last initial", () => {
    expect(maskName("Aanya Rao")).toBe("Aanya R.");
    expect(maskName("  Rohan   Mehta ")).toBe("Rohan M.");
  });
  it("handles single-word names", () => {
    expect(maskName("Madonna")).toBe("Madonna");
  });
  it("uses the final token as the surname", () => {
    expect(maskName("Maria del Carmen Fernandez")).toBe("Maria F.");
  });
});
