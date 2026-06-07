import { describe, it, expect } from "vitest";
import { can, effectivePermissions, canFromList } from "@/lib/permissions";

describe("can() — role tiers", () => {
  it("SUPER_ADMIN can do everything", () => {
    expect(can({ role: "SUPER_ADMIN" }, "team.manage")).toBe(true);
    expect(can({ role: "SUPER_ADMIN" }, "settings.manage")).toBe(true);
  });
  it("ADMIN manages content/registrations but not team or settings", () => {
    expect(can({ role: "ADMIN" }, "content.manage")).toBe(true);
    expect(can({ role: "ADMIN" }, "registrations.manage")).toBe(true);
    expect(can({ role: "ADMIN" }, "team.manage")).toBe(false);
    expect(can({ role: "ADMIN" }, "settings.manage")).toBe(false);
  });
  it("VIEWER is read-only", () => {
    expect(can({ role: "VIEWER" }, "registrations.read")).toBe(true);
    expect(can({ role: "VIEWER" }, "registrations.manage")).toBe(false);
    expect(can({ role: "VIEWER" }, "content.manage")).toBe(false);
  });
});

describe("can() — per-user overrides", () => {
  it("extraPermissions grants beyond the role", () => {
    expect(can({ role: "VIEWER", extraPermissions: JSON.stringify(["registrations.manage"]) }, "registrations.manage")).toBe(true);
  });
  it("deniedPermissions revokes even from the role", () => {
    expect(can({ role: "ADMIN", deniedPermissions: JSON.stringify(["content.manage"]) }, "content.manage")).toBe(false);
  });
  it("denied beats extra", () => {
    expect(can({ role: "VIEWER", extraPermissions: JSON.stringify(["settings.manage"]), deniedPermissions: JSON.stringify(["settings.manage"]) }, "settings.manage")).toBe(false);
  });
});

describe("effectivePermissions + canFromList", () => {
  it("super-admin resolves to wildcard", () => {
    const list = effectivePermissions({ role: "SUPER_ADMIN" });
    expect(list).toEqual(["*"]);
    expect(canFromList(list, "team.manage")).toBe(true);
  });
  it("viewer list excludes manage actions", () => {
    const list = effectivePermissions({ role: "VIEWER" });
    expect(canFromList(list, "registrations.read")).toBe(true);
    expect(canFromList(list, "registrations.manage")).toBe(false);
  });
});
