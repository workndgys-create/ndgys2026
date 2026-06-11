import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin } from "@/lib/adminSession";
import { generateBadgePdf, generateBadgeSheet, BadgeData } from "@/lib/badge";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const id = sp.get("id");
  const track = sp.get("track") || undefined;

  if (id) {
    const r = await prisma.registration.findUnique({ where: { id }, include: { photo: true } });
    if (r && r.delegateId) {
      const pdf = await generateBadgePdf({
        delegateId: r.delegateId,
        fullName: r.fullName,
        trackName: r.trackName,
        trackSlug: r.trackSlug,
        portfolio: r.portfolio,
        institution: r.institution,
        city: r.city,
        categoryLabel: "Portfolio",
        photoData: r.photo?.data ? Buffer.from(r.photo.data) : undefined,
        photoMime: r.photo?.mime
      });
      return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="badge-${r.delegateId}.pdf"` } });
    } else {
      const c = await prisma.competitionRegistration.findUnique({ where: { id } });
      if (!c || c.status !== "PAID" || !c.refId) return NextResponse.json({ error: "Attendee not found or unpaid" }, { status: 404 });
      const comp = await prisma.competition.findUnique({ where: { id: c.competitionId } });
      const trackSlug = comp?.slug || c.competitionId;
      const pdf = await generateBadgePdf({
        delegateId: c.refId,
        fullName: c.leaderName,
        trackName: c.competitionTitle,
        trackSlug,
        portfolio: null,
        institution: c.institution,
        city: c.city,
        categoryLabel: "Competition",
        photoData: undefined,
        photoMime: undefined
      });
      return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="badge-${c.refId}.pdf"` } });
    }
  }

  let list: BadgeData[] = [];

  // 1. MUN Registrations
  const munWhere: any = { status: "PAID", NOT: { delegateId: null } };
  let fetchMun = true;
  if (track) {
    const trackExists = await prisma.track.findUnique({ where: { slug: track } });
    if (trackExists) {
      munWhere.trackSlug = track;
    } else {
      fetchMun = false;
    }
  }

  if (fetchMun) {
    const regs = await prisma.registration.findMany({
      where: munWhere,
      include: { photo: true },
      orderBy: [{ trackSlug: "asc" }, { fullName: "asc" }]
    });
    list = list.concat(regs.map((r) => ({
      delegateId: r.delegateId!,
      fullName: r.fullName,
      trackName: r.trackName,
      trackSlug: r.trackSlug,
      portfolio: r.portfolio,
      institution: r.institution,
      city: r.city,
      categoryLabel: "Portfolio",
      photoData: r.photo?.data ? Buffer.from(r.photo.data) : undefined,
      photoMime: r.photo?.mime
    })));
  }
  // 2. Competition Registrations
  const compWhere: any = { status: "PAID" };
  let fetchComps = true;

  if (track) {
    const comp = await prisma.competition.findUnique({
      where: { slug: track }
    });

    if (comp) {
      compWhere.competitionId = comp.id;
    } else {
      fetchComps = false;
    }
  }

  if (fetchComps) {
    const compRegs = await prisma.competitionRegistration.findMany({
      where: compWhere,
      orderBy: [
        { competitionTitle: "asc" },
        { leaderName: "asc" }
      ]
    });

    const compIds = Array.from(
      new Set(compRegs.map((c) => c.competitionId))
    );

    const comps = await prisma.competition.findMany({
      where: {
        id: {
          in: compIds
        }
      }
    });

    const slugMap = new Map(
      comps.map((c) => [c.id, c.slug])
    );

    for (const c of compRegs) {
      const members: { name: string; age?: number }[] =
        typeof c.members === "string"
          ? JSON.parse(c.members)
          : c.members || [];

      const trackSlug = slugMap.get(c.competitionId) || c.competitionId;

      // Build a flat list: leader always first, then additional members.
      // Each participant gets a unique derived ID so their QR codes differ:
      //   leader  → refId          (e.g. NDGYS-C-2026-0042)
      //   member2 → refId-M2       (e.g. NDGYS-C-2026-0042-M2)
      //   member3 → refId-M3       ...
      const allParticipants: { name: string }[] = [
        { name: c.leaderName },
        ...members
      ];

      allParticipants.forEach((participant, index) => {
        // index 0 = leader keeps the canonical refId for backward compatibility.
        // All subsequent members get a deterministic per-seat suffix.
        const memberId = index === 0 ? c.refId : `${c.refId}-M${index + 1}`;

        list.push({
          delegateId: memberId,
          fullName: participant.name,
          trackName: c.competitionTitle,
          trackSlug,
          portfolio: null,
          institution: c.institution,
          city: c.city,
          categoryLabel: "Competition",
          photoData: undefined,
          photoMime: undefined
        });
      });
    }
  }

  const pdf = await generateBadgeSheet(list);

  return new NextResponse(
    new Uint8Array(pdf),
    {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="badges${
            track ? "-" + track : ""
          }.pdf`
      }
    }
  );
}
