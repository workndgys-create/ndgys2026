import { NextRequest, NextResponse } from "next/server";
import { currentAdmin, requireRole, audit } from "@/lib/adminSession";
import { getAllSettings, setSetting, SETTING_KEYS, SettingKey } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET() {
  const s = await currentAdmin();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ settings: await getAllSettings(), role: s.role });
}

export async function PATCH(req: NextRequest) {
  const s = await requireRole("SUPER_ADMIN");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const updates = Object.entries(body).filter(([k]) => (SETTING_KEYS as readonly string[]).includes(k));
  for (const [k, v] of updates) await setSetting(k as SettingKey, String(v));
  await audit(s.email, "settings.update", "Setting", undefined, JSON.stringify(Object.fromEntries(updates)));
  return NextResponse.json({ ok: true, settings: await getAllSettings() });
}
