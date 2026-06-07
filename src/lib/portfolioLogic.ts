export type PortfolioStatus = "AVAILABLE" | "HELD" | "ASSIGNED";
export type PortfolioState = "available" | "held" | "mine" | "taken";

export interface PortfolioRow {
  status: PortfolioStatus;
  heldUntil?: Date | string | null;
  heldBy?: string | null;
  assignedTo?: string | null;
}

function holdExpired(p: PortfolioRow, now: Date): boolean {
  if (p.status !== "HELD" || !p.heldUntil) return false;
  return new Date(p.heldUntil).getTime() < now.getTime();
}

/** A HELD row whose timer has lapsed and should be swept back to AVAILABLE. */
export function isExpiredHold(p: PortfolioRow, now: Date = new Date()): boolean {
  return holdExpired(p, now);
}

/** Can `registrationId` acquire/keep a hold on this portfolio right now? */
export function canAcquire(p: PortfolioRow, registrationId: string, now: Date = new Date()): boolean {
  if (p.status === "ASSIGNED") return false;
  if (p.status === "AVAILABLE") return true;
  // HELD: only if expired, or already mine
  if (holdExpired(p, now)) return true;
  return p.heldBy === registrationId;
}

/** State to show a given viewer (their own active hold reads as "mine"). */
export function deriveState(p: PortfolioRow, viewerRegistrationId: string | null, now: Date = new Date()): PortfolioState {
  if (p.status === "ASSIGNED") return "taken";
  if (p.status === "HELD") {
    if (holdExpired(p, now)) return "available";
    return viewerRegistrationId && p.heldBy === viewerRegistrationId ? "mine" : "held";
  }
  return "available";
}
