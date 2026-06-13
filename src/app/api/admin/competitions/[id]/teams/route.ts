import { NextRequest, NextResponse } from "next/server";
import { requirePermission, audit } from "@/lib/adminSession";
import { prisma } from "@/lib/prisma";

async function loadTeams(compId: string) {
  const key = `competition:teams:${compId}`;
  const s = await prisma.setting.findUnique({ where: { key } });
  if (!s || !s.value) return [];
  try { return JSON.parse(s.value); } catch { return []; }
}

async function saveTeams(compId: string, teams: string[]) {
  const key = `competition:teams:${compId}`;
  return prisma.setting.upsert({ where: { key }, update: { value: JSON.stringify(teams) }, create: { key, value: JSON.stringify(teams) } });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await requirePermission("competitions.manage");
  if (!perm) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = params;
  const teams = await loadTeams(id);
  return NextResponse.json({ teams });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await requirePermission("competitions.manage");
  if (!perm) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = params;
  const body = await req.json().catch(() => ({}));
  const teams = await loadTeams(id);
  if (body.name) {
    teams.push(String(body.name));
    await saveTeams(id, teams);
    await audit(perm.email, "team.create", "competition", id, JSON.stringify({ name: body.name }));
    return NextResponse.json({ teams });
  }
  if (Array.isArray(body.teams)) {
    await saveTeams(id, body.teams.map(String));
    await audit(perm.email, "team.replace", "competition", id, null);
    return NextResponse.json({ teams: body.teams });
  }
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await requirePermission("competitions.manage");
  if (!perm) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = params;
  const body = await req.json().catch(() => ({}));
  const teams = await loadTeams(id);
  if (typeof body.index === "number" && body.name) {
    const idx = body.index;
    if (idx < 0 || idx >= teams.length) return NextResponse.json({ error: "Index out of range" }, { status: 400 });
    teams[idx] = String(body.name);
    await saveTeams(id, teams);
    await audit(perm.email, "team.update", "competition", id, JSON.stringify({ index: idx, name: body.name }));
    return NextResponse.json({ teams });
  }
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const perm = await requirePermission("competitions.manage");
  if (!perm) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = params;
  const body = await req.json().catch(() => ({}));
  const teams = await loadTeams(id);
  if (typeof body.index === "number") {
    const idx = body.index;
    if (idx < 0 || idx >= teams.length) return NextResponse.json({ error: "Index out of range" }, { status: 400 });
    teams.splice(idx, 1);
    await saveTeams(id, teams);
    await audit(perm.email, "team.delete", "competition", id, JSON.stringify({ index: idx }));
    return NextResponse.json({ teams });
  }
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
