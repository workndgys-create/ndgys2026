import { describe, it, expect } from "vitest";
import { canAcquire, deriveState, isExpiredHold, PortfolioRow } from "@/lib/portfolioLogic";

const now = new Date("2026-06-06T12:00:00Z");
const future = new Date("2026-06-06T12:05:00Z").toISOString();
const past = new Date("2026-06-06T11:50:00Z").toISOString();

describe("canAcquire", () => {
  it("succeeds on an AVAILABLE portfolio", () => {
    expect(canAcquire({ status: "AVAILABLE" }, "r1", now)).toBe(true);
  });
  it("succeeds on a HELD portfolio whose hold expired", () => {
    expect(canAcquire({ status: "HELD", heldUntil: past, heldBy: "other" }, "r1", now)).toBe(true);
  });
  it("succeeds if the active hold is already mine", () => {
    expect(canAcquire({ status: "HELD", heldUntil: future, heldBy: "r1" }, "r1", now)).toBe(true);
  });
  it("fails on an active hold owned by someone else", () => {
    expect(canAcquire({ status: "HELD", heldUntil: future, heldBy: "other" }, "r1", now)).toBe(false);
  });
  it("fails on an ASSIGNED portfolio", () => {
    expect(canAcquire({ status: "ASSIGNED", assignedTo: "other" }, "r1", now)).toBe(false);
  });
});

describe("isExpiredHold", () => {
  it("is true only for lapsed holds", () => {
    expect(isExpiredHold({ status: "HELD", heldUntil: past }, now)).toBe(true);
    expect(isExpiredHold({ status: "HELD", heldUntil: future }, now)).toBe(false);
    expect(isExpiredHold({ status: "ASSIGNED", heldUntil: past }, now)).toBe(false); // never sweep ASSIGNED
    expect(isExpiredHold({ status: "AVAILABLE" }, now)).toBe(false);
  });
});

describe("deriveState (viewer-relative)", () => {
  const mine: PortfolioRow = { status: "HELD", heldUntil: future, heldBy: "r1" };
  it("shows my active hold as 'mine'", () => expect(deriveState(mine, "r1", now)).toBe("mine"));
  it("shows someone else's active hold as 'held'", () => expect(deriveState(mine, "r2", now)).toBe("held"));
  it("shows an expired hold as 'available'", () => expect(deriveState({ status: "HELD", heldUntil: past, heldBy: "r2" }, "r1", now)).toBe("available"));
  it("shows ASSIGNED as 'taken'", () => expect(deriveState({ status: "ASSIGNED", assignedTo: "r2" }, "r1", now)).toBe("taken"));
});
