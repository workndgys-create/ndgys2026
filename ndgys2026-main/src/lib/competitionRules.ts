export type Participation = "SOLO" | "GROUP";
export type CompetitionFormat = "SOLO" | "GROUP" | "BOTH";

export interface FeeConfig {
  format: CompetitionFormat;
  feeSolo?: number | null;  // rupees
  feeGroup?: number | null; // rupees (per team)
}

/** Returns the fee (rupees) for the chosen participation, or null if not offered. */
export function feeForParticipation(c: FeeConfig, participation: Participation): number | null {
  if (participation === "SOLO") {
    if (c.format === "GROUP") return null;
    return c.feeSolo ?? null;
  }
  if (c.format === "SOLO") return null;
  return c.feeGroup ?? null;
}

export interface TeamConfig {
  format: CompetitionFormat;
  minTeam?: number | null;
  maxTeam?: number | null;
}

/** Validates participation + team size against a competition's format/limits. */
export function validateTeam(c: TeamConfig, participation: Participation, memberCount: number): { ok: true } | { ok: false; error: string } {
  if (participation === "SOLO") {
    if (c.format === "GROUP") return { ok: false, error: "This competition is group-only." };
    return { ok: true };
  }
  if (c.format === "SOLO") return { ok: false, error: "This competition is solo-only." };
  const min = c.minTeam ?? 2;
  const max = c.maxTeam ?? 8;
  if (memberCount < min) return { ok: false, error: `A team needs at least ${min} members.` };
  if (memberCount > max) return { ok: false, error: `A team can have at most ${max} members.` };
  return { ok: true };
}
