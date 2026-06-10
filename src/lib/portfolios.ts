import { prisma } from "./prisma";
import { getSetting } from "./settings";
import { canAcquire, deriveState, PortfolioRow, PortfolioState } from "./portfolioLogic";

export async function getHoldMinutes(): Promise<number> {
  const v = Number(await getSetting("portfolio.holdMinutes", "10"));
  return Number.isFinite(v) && v > 0 ? v : 10;
}

/** Sweep expired holds back to AVAILABLE. Never touches ASSIGNED rows. */
export async function releaseExpiredHolds(): Promise<number> {
  const res = await prisma.portfolio.updateMany({
    where: { status: "HELD", heldUntil: { lt: new Date() } },
    data: { status: "AVAILABLE", heldUntil: null, heldBy: null }
  });
  return res.count;
}

export interface PublicPortfolio {
  id: string;
  name: string;
  order: number;
  state: PortfolioState;
  heldUntil: string | null; // only populated when state === "mine"
}

/** Portfolios for a committee with viewer-relative state. Sweeps expired holds first. */
export async function listPortfolios(trackSlug: string, viewerRegistrationId: string | null): Promise<PublicPortfolio[]> {
  await releaseExpiredHolds();
  const rows = await prisma.portfolio.findMany({ where: { trackSlug }, orderBy: [{ order: "asc" }, { name: "asc" }] });
  // If this is the International Press committee, only expose these three portfolio names
  const track = await prisma.track.findUnique({ where: { slug: trackSlug } });
  const isInternationalPress = track && String(track.name).trim().toLowerCase() === "international press";
  const allowed = new Set(["journalist", "caricature", "photographer"]);
  const filteredRows = isInternationalPress ? rows.filter((r) => allowed.has(String(r.name).toLowerCase())) : rows;
  const now = new Date();
  return (filteredRows as unknown as (PortfolioRow & { id: string; name: string; order: number })[]).map((p) => {
    const state = deriveState(p, viewerRegistrationId, now);
    return { id: p.id, name: p.name, order: p.order, state, heldUntil: state === "mine" && p.heldUntil ? new Date(p.heldUntil).toISOString() : null };
  });
}

export interface HoldResult { ok: boolean; heldUntil?: string; name?: string; reason?: "unavailable" | "not_found" }

/**
 * Atomically place/refresh a hold on a portfolio for a registration.
 * The conditional updateMany IS the lock — if it updates 0 rows the portfolio is taken.
 */
export async function holdPortfolio(portfolioId: string, registrationId: string): Promise<HoldResult> {
  await releaseExpiredHolds();
  const portfolio = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
  if (!portfolio) return { ok: false, reason: "not_found" };

  const minutes = await getHoldMinutes();
  const heldUntil = new Date(Date.now() + minutes * 60_000);
  const now = new Date();

  // Mirror canAcquire() in a single guarded write.
  const res = await prisma.portfolio.updateMany({
    where: {
      id: portfolioId,
      OR: [
        { status: "AVAILABLE" },
        { status: "HELD", heldUntil: { lt: now } },
        { status: "HELD", heldBy: registrationId }
      ]
    },
    data: { status: "HELD", heldUntil, heldBy: registrationId }
  });

  if (res.count === 0) {
    // Sanity: confirm the pure predicate agrees (defensive; helps in tests/logs)
    if (canAcquire(portfolio as unknown as PortfolioRow, registrationId, now)) {
      // lost a race between findUnique and updateMany — treat as unavailable
    }
    return { ok: false, reason: "unavailable" };
  }
  return { ok: true, heldUntil: heldUntil.toISOString(), name: portfolio.name };
}

/** Release any hold currently held by this registration (explicit cancel / re-pick). */
export async function releaseHoldByRegistration(registrationId: string): Promise<number> {
  const res = await prisma.portfolio.updateMany({
    where: { status: "HELD", heldBy: registrationId },
    data: { status: "AVAILABLE", heldUntil: null, heldBy: null }
  });
  return res.count;
}

/**
 * Assign the portfolio selected by a registration (called on payment success).
 * Idempotent: assigning an already-ASSIGNED-to-this-registration portfolio is a no-op.
 * Returns the assigned portfolio name (so the caller can store the label), or null.
 */
export async function assignPortfolioForRegistration(registrationId: string, portfolioId: string | null): Promise<string | null> {
  if (!portfolioId) return null;
  const p = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
  if (!p) return null;
  if (p.status === "ASSIGNED" && p.assignedTo === registrationId) return p.name; // already done
  await prisma.portfolio.update({
    where: { id: portfolioId },
    data: { status: "ASSIGNED", assignedTo: registrationId, heldUntil: null, heldBy: null }
  });
  return p.name;
}

/** Manual admin assignment by committee + name (used by the allocations editor override). */
export async function assignPortfolioByName(registrationId: string, trackSlug: string, name: string): Promise<string | null> {
  const p = await prisma.portfolio.findFirst({ where: { trackSlug, name } });
  if (!p) return null;
  // free any other portfolio this registration was holding/assigned, then take this one
  await prisma.portfolio.updateMany({ where: { trackSlug, assignedTo: registrationId, NOT: { id: p.id } }, data: { status: "AVAILABLE", assignedTo: null } });
  await prisma.portfolio.update({ where: { id: p.id }, data: { status: "ASSIGNED", assignedTo: registrationId, heldUntil: null, heldBy: null } });
  return p.id;
}
