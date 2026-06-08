import { describe, it, expect } from "vitest";
import { buildIcs } from "@/lib/ics";

describe("buildIcs", () => {
  const ics = buildIcs({
    uid: "abc@nesummit.in",
    title: "Summit, 2026",
    start: new Date("2026-08-08T03:30:00Z"),
    end: new Date("2026-08-09T12:00:00Z"),
    location: "New Delhi; India",
    description: "Line one"
  });
  it("wraps a valid VCALENDAR/VEVENT", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(ics.includes("BEGIN:VEVENT")).toBe(true);
    expect(ics.trim().endsWith("END:VCALENDAR")).toBe(true);
  });
  it("includes the UID and UTC timestamps", () => {
    expect(ics).toContain("UID:abc@nesummit.in");
    expect(ics).toContain("DTSTART:20260808T033000Z");
    expect(ics).toContain("DTEND:20260809T120000Z");
  });
  it("escapes commas and semicolons in text fields", () => {
    expect(ics).toContain("SUMMARY:Summit\\, 2026");
    expect(ics).toContain("LOCATION:New Delhi\\; India");
  });
  it("uses CRLF line endings", () => {
    expect(ics.includes("\r\n")).toBe(true);
  });
});
