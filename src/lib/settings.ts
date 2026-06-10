import { prisma } from "./prisma";

/** Runtime-editable flags, stored in the Setting table. */
export const SETTING_KEYS = ["home.published", "allocations.live", "registration.open", "portfolio.holdMinutes", "ipl.auction.activeHouse", "event.start", "event.end", "event.venue", "venue.address", "venue.mapQuery", "venue.metro", "venue.airport", "venue.parking", "venue.notes", "safety.grievanceEmail", "safety.grievancePhone"] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

const ENV_FALLBACK: Record<SettingKey, string> = {
  "home.published": process.env.NEXT_PUBLIC_HOME_PUBLISHED ?? "true",
  "allocations.live": process.env.NEXT_PUBLIC_ALLOCATIONS_LIVE ?? "false",
  "registration.open": process.env.NEXT_PUBLIC_REGISTRATION_OPEN ?? "true",
  "portfolio.holdMinutes": process.env.PORTFOLIO_HOLD_MINUTES ?? "10",
  "ipl.auction.activeHouse": process.env.IPL_AUCTION_ACTIVE_HOUSE ?? "1",
  "event.start": process.env.EVENT_START ?? "2026-08-22T09:00:00+05:30",
  "event.end": process.env.EVENT_END ?? "2026-08-23T17:30:00+05:30",
  "event.venue": process.env.EVENT_VENUE ?? "IIT Delhi, New Delhi",
  "venue.address": process.env.VENUE_ADDRESS ?? "Indian Institute of Technology Delhi, Hauz Khas, New Delhi, Delhi 110016",
  "venue.mapQuery": process.env.VENUE_MAP_QUERY ?? "IIT Delhi, Hauz Khas, New Delhi",
  "venue.metro": process.env.VENUE_METRO ?? "Nearest Metro: IIT Delhi (Magenta Line), ~1 km. Hauz Khas (Yellow/Magenta interchange) is ~2.5 km.",
  "venue.airport": process.env.VENUE_AIRPORT ?? "Indira Gandhi International Airport (DEL) is ~15 km / 35-45 min by cab.",
  "venue.parking": process.env.VENUE_PARKING ?? "On-campus visitor parking is available; carpooling and metro are recommended on event days.",
  "venue.notes": process.env.VENUE_NOTES ?? "Carry a government photo ID and your delegate QR for entry. Gates open 60 minutes before the first session.",
  "safety.grievanceEmail": process.env.SAFETY_GRIEVANCE_EMAIL ?? "safety@nesummit.in",
  "safety.grievancePhone": process.env.SAFETY_GRIEVANCE_PHONE ?? "+91 96500 58469"
};

export async function getSetting(key: SettingKey, fallback?: string): Promise<string> {
  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    if (row) return row.value;
  } catch {
    /* DB unavailable — use fallback */
  }
  return fallback ?? ENV_FALLBACK[key] ?? "";
}

export async function getFlag(key: SettingKey): Promise<boolean> {
  return (await getSetting(key)) === "true";
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const out: Record<string, string> = { ...ENV_FALLBACK };
  try {
    const rows = await prisma.setting.findMany();
    for (const r of rows as unknown as { key: string; value: string }[]) out[r.key] = r.value;
  } catch {
    /* ignore */
  }
  return out;
}

export async function setSetting(key: SettingKey, value: string) {
  await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
}
