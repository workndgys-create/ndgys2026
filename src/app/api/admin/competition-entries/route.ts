import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin } from "@/lib/adminSession";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const competitionId = sp.get("competition") || "";
  const status = sp.get("status") || "";
  const participation = sp.get("participation") || "";
  const where: any = {
    AND: [
      competitionId ? { competitionId } : {},
      status ? { status } : {},
      participation ? { participation } : {}
    ]
  };
  const entries = await prisma.competitionRegistration.findMany({ where, orderBy: { createdAt: "desc" } });

  if (sp.get("format") === "csv") {
    const rows = [["Ref", "Competition", "Type", "Team", "Leader", "Email", "Phone", "Age", "Gender", "City", "Emergency", "HowHeard", "Members", "PastExperience", "Answers", "Notes", "Amount(₹)", "Status", "Created"]];
    for (const e of entries as any[]) {
      let members = "";
      try { members = (JSON.parse(e.members) as { name: string }[]).map((m) => m.name).join("; "); } catch {}
      let answers = "";
      try { answers = (JSON.parse(e.answers || "[]") as { q: string; a: string }[]).map((x) => `${x.q}: ${x.a}`).join(" | "); } catch {}
      rows.push([e.refId, e.competitionTitle, e.participation, e.teamName || "", e.leaderName, e.email, e.phone, e.age ?? "", e.gender ?? "", e.city ?? "", e.emergencyContact ?? "", e.howHeard ?? "", members, e.pastExperience ?? "", answers, e.notes ?? "", String(e.amount / 100), e.status, new Date(e.createdAt).toISOString()]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="competition-entries.csv"' } });
  }

  // also return the competition list for the filter dropdown
  const competitions = await prisma.competition.findMany({ orderBy: { order: "asc" }, select: { id: true, title: true } });
  return NextResponse.json({ entries, competitions });
}
