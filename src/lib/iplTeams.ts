import { prisma } from "./prisma";

export const DEFAULT_IPL_TEAMS = [
  "Chennai Super Kings",
  "Deccan Chargers",
  "Delhi Capitals",
  "Royal Challengers Bangalore",
  "Gujarat Titans",
  "Kolkata Knight Riders",
  "Lucknow Super Giants",
  "Mumbai Indians",
  "Punjab Kings",
  "Rajasthan Royals",
  "Rising Pune Supergiant",
  "Royal Challengers Bengaluru",
  "Sunrisers Hyderabad",
];

export async function getIplTeamsFromDb(): Promise<string[]> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: "ipl.teams" } });
    if (!row || !row.value) return DEFAULT_IPL_TEAMS;
    try {
      const parsed = JSON.parse(row.value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // fallthrough
    }
    return DEFAULT_IPL_TEAMS;
  } catch (err) {
    return DEFAULT_IPL_TEAMS;
  }
}

export async function setIplTeamsInDb(teams: string[]) {
  const value = JSON.stringify(teams || []);
  return prisma.setting.upsert({ where: { key: "ipl.teams" }, update: { value }, create: { key: "ipl.teams", value } });
}
