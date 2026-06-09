import { NextRequest, NextResponse } from "next/server";
import { currentAdmin, requireRole, audit } from "@/lib/adminSession";
import { getAllSettings, setSetting, SETTING_KEYS, SettingKey } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET() {
  const s = await currentAdmin();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ settings: await getAllSettings(), role: s.role });
  } catch (error) {
    console.error("[admin/settings] GET failed", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const s = await requireRole("SUPER_ADMIN");
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json().catch(() => ({}));
    const updates = Object.entries(body).filter(([k]) => (SETTING_KEYS as readonly string[]).includes(k));
    for (const [k, v] of updates) await setSetting(k as SettingKey, String(v));
    await audit(s.email, "settings.update", "Setting", undefined, JSON.stringify(Object.fromEntries(updates)));
    return NextResponse.json({ ok: true, settings: await getAllSettings() });
  } catch (error) {
    console.error("[admin/settings] PATCH failed", { email: s.email, error });
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
