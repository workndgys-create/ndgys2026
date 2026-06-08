"use client";
import { useEffect, useState } from "react";
import AdminShell, { Panel } from "@/components/admin/Shell";

const TEXT_SETTINGS: { key: string; label: string; area?: boolean }[] = [
  { key: "venue.address", label: "Venue address", area: true },
  { key: "venue.mapQuery", label: "Map search query (Google Maps)" },
  { key: "venue.metro", label: "By Metro", area: true },
  { key: "venue.airport", label: "By Air", area: true },
  { key: "venue.parking", label: "Parking & on-site", area: true },
  { key: "venue.notes", label: "Venue notes", area: true },
  { key: "safety.grievanceEmail", label: "Safety / grievance email" },
  { key: "safety.grievancePhone", label: "Safety / grievance phone" }
];

const TOGGLES: { key: string; label: string; help: string }[] = [
  { key: "home.published", label: "Home page content live", help: "Master switch for events, competitions, speakers and event flow on the home page." },
  { key: "allocations.live", label: "Portfolio allocations live", help: "Show the live allocations section on the home page." },
  { key: "registration.open", label: "Registration open", help: "When off, the registration API rejects new sign-ups." }
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [role, setRole] = useState<string>("");
  const [saved, setSaved] = useState(false);
  const readOnly = role !== "SUPER_ADMIN";

  useEffect(() => {
    fetch("/api/admin/settings").then(async (r) => {
      if (!r.ok) return;
      const d = await r.json(); setSettings(d.settings); setRole(d.role);
    });
  }, []);

  async function toggle(key: string) {
    if (readOnly || !settings) return;
    const next = settings[key] === "true" ? "false" : "true";
    setSettings({ ...settings, [key]: next });
    const res = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: next }) });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 1500); }
  }

  function setText(key: string, value: string) { if (settings) setSettings({ ...settings, [key]: value }); }
  async function saveText() {
    if (readOnly || !settings) return;
    const payload = Object.fromEntries(TEXT_SETTINGS.map((t) => [t.key, settings[t.key] ?? ""]));
    const res = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 1500); }
  }

  return (
    <AdminShell title="Settings">
      <Panel title="Live switches" action={saved ? <span className="text-sm text-[#D97706]">Saved ✓</span> : null}>
        {!settings ? (
          <p className="text-slatey">Loading…</p>
        ) : (
          <div className="space-y-4">
            {readOnly && <p className="rounded-lg bg-[#D97706]/10 px-4 py-2 text-sm text-[#92400E]">Read-only — only a super-admin can change settings.</p>}
            {TOGGLES.map((t) => {
              const on = settings[t.key] === "true";
              return (
                <div key={t.key} className="flex items-center justify-between gap-4 border-b border-ink/5 pb-4 last:border-0">
                  <div>
                    <p className="font-600 text-ink">{t.label}</p>
                    <p className="text-sm text-slatey">{t.help}</p>
                  </div>
                  <button
                    onClick={() => toggle(t.key)} disabled={readOnly}
                    aria-pressed={on}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-[#D97706]" : "bg-ink/20"} ${readOnly ? "opacity-50" : ""}`}
                  >
                    <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-cream transition ${on ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Venue, travel & safety" action={saved ? <span className="text-sm text-[#D97706]">Saved ✓</span> : null}>
        {!settings ? <p className="text-slatey">Loading…</p> : (
          <div className="space-y-4">
            {readOnly && <p className="rounded-lg bg-[#D97706]/10 px-4 py-2 text-sm text-[#92400E]">Read-only — only a super-admin can change settings.</p>}
            <p className="text-sm text-slatey">These power the public <b>/venue</b> page and the <b>/code-of-conduct</b> grievance contact.</p>
            {TEXT_SETTINGS.map((t) => (
              <div key={t.key}>
                <label className="text-sm font-500 text-ink/80">{t.label}</label>
                {t.area ? (
                  <textarea disabled={readOnly} value={settings[t.key] ?? ""} onChange={(e) => setText(t.key, e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold disabled:opacity-60" />
                ) : (
                  <input disabled={readOnly} value={settings[t.key] ?? ""} onChange={(e) => setText(t.key, e.target.value)} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold disabled:opacity-60" />
                )}
              </div>
            ))}
            {!readOnly && <button onClick={saveText} className="rounded-full bg-gold px-6 py-2.5 font-600 text-midnight hover:bg-goldlite">Save venue & safety</button>}
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
