import { prisma } from "./prisma";
import { TRACKS } from "./validation";
import { getFlag } from "./settings";
import { maskName } from "./names";
export { maskName } from "./names";

export type PublicTrack = {
  slug: string; name: string; fee: number; capacity: number;
  agenda: string; difficulty: string; isOpen: boolean; seatsRemaining: number; full: boolean;
};

function logPublicDataError(scope: string, error: unknown) {
  console.error(`[publicData] ${scope} failed`, error);
}

/** Reads tracks from the DB with live seats-remaining; falls back to the seed list if the DB is empty/unavailable. */
export async function getPublicTracks(): Promise<PublicTrack[]> {
  try {
    const [tracks, paid] = await Promise.all([
      prisma.track.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.registration.groupBy({ by: ["trackSlug"], where: { status: "PAID" }, _count: true })
    ]);
    if (tracks.length === 0) throw new Error("empty");
    const paidMap = new Map((paid as unknown as { trackSlug: string; _count: number }[]).map((p) => [p.trackSlug, p._count]));
    return tracks.map((t: { slug: string; name: string; fee: number; capacity: number; agenda: string; difficulty: string; isOpen: boolean }) => {
      const used = paidMap.get(t.slug) ?? 0;
      const seatsRemaining = Math.max(0, t.capacity - used);
      return { slug: t.slug, name: t.name, fee: t.fee, capacity: t.capacity, agenda: t.agenda, difficulty: t.difficulty, isOpen: t.isOpen, seatsRemaining, full: seatsRemaining === 0 || !t.isOpen };
    });
  } catch (error) {
    logPublicDataError("getPublicTracks", error);
    return TRACKS.map((t) => ({ ...t, isOpen: true, seatsRemaining: t.capacity, full: false }));
  }
}


export type Allocation = { portfolio: string; delegateName: string; allocatedAt: string };
export type CommitteeAllocations = { slug: string; name: string; capacity: number; allocatedCount: number; seatsRemaining: number; allocations: Allocation[] };
export type AllocationsPayload = { committees: CommitteeAllocations[]; generatedAt: string; published: boolean };

/** Live portfolio allocations grouped by committee (PAID + portfolio set), masked. */
export async function getPublicAllocations(): Promise<AllocationsPayload> {
  const generatedAt = new Date().toISOString();
  const published = await getFlag("allocations.live");
  if (!published) return { committees: [], generatedAt, published: false };

  try {
    const tracks = await getPublicTracks();
    const order = new Map<string, number>(TRACKS.map((t, i) => [t.slug as string, i]));
    const regs = await prisma.registration.findMany({
      where: { status: "PAID", NOT: { portfolio: null } },
      select: { fullName: true, portfolio: true, trackSlug: true, updatedAt: true }
    });
    const R = regs as unknown as { fullName: string; portfolio: string | null; trackSlug: string; updatedAt: Date }[];

    const byTrack = new Map<string, Allocation[]>();
    for (const r of R) {
      if (!r.portfolio) continue;
      const list = byTrack.get(r.trackSlug) ?? [];
      list.push({ portfolio: r.portfolio, delegateName: maskName(r.fullName), allocatedAt: r.updatedAt.toISOString() });
      byTrack.set(r.trackSlug, list);
    }

    const committees: CommitteeAllocations[] = tracks
      .map((t) => {
        const allocations = (byTrack.get(t.slug) ?? []).sort((a, b) => a.portfolio.localeCompare(b.portfolio));
        return { slug: t.slug, name: t.name, capacity: t.capacity, allocatedCount: allocations.length, seatsRemaining: Math.max(0, t.capacity - allocations.length), allocations };
      })
      .sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99));

    return { committees, generatedAt, published: true };
  } catch (error) {
    logPublicDataError("getPublicAllocations", error);
    return { committees: [], generatedAt, published: true };
  }
}

// ── CMS-driven public sections (all gated by home.published) ──────────
async function homeOn() {
  return getFlag("home.published");
}

export async function getPublicCompetitions() {
  if (!(await homeOn())) return [];
  try {
    return await prisma.competition.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  } catch (error) {
    logPublicDataError("getPublicCompetitions", error);
    return [];
  }
}

export async function getPublicEvents() {
  if (!(await homeOn())) return [];
  try {
    return await prisma.event.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  } catch (error) {
    logPublicDataError("getPublicEvents", error);
    return [];
  }
}

export async function getPublicSpeakers() {
  if (!(await homeOn())) return [];
  try {
    return await prisma.speaker.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  } catch (error) {
    logPublicDataError("getPublicSpeakers", error);
    return [];
  }
}

export async function getPublicFlow() {
  if (!(await homeOn())) return [];
  try {
    return await prisma.scheduleItem.findMany({ where: { published: true }, orderBy: [{ day: "asc" }, { order: "asc" }] });
  } catch (error) {
    logPublicDataError("getPublicFlow", error);
    return [];
  }
}

export async function getCompetitionBySlug(slug: string) {
  try {
    const c = await prisma.competition.findUnique({ where: { slug } });
    if (!c || !c.published) return null;
    return c;
  } catch (error) {
    logPublicDataError(`getCompetitionBySlug:${slug}`, error);
    return null;
  }
}

export async function getPublicSecretariat() {
  if (!(await homeOn())) return [];
  try {
    return await prisma.secretariatMember.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  } catch (error) {
    logPublicDataError("getPublicSecretariat", error);
    return [];
  }
}

export async function getPublicSponsors() {
  if (!(await homeOn())) return [];
  try {
    return await prisma.sponsor.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  } catch (error) {
    logPublicDataError("getPublicSponsors", error);
    return [];
  }
}

export async function getPublicAccommodation() {
  try {
    return await prisma.accommodationOption.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  } catch (error) {
    logPublicDataError("getPublicAccommodation", error);
    return [];
  }
}
