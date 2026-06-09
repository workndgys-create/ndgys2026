"use client";
import AdminShell from "@/components/admin/Shell";
import CrudManager from "@/components/admin/Crud";
import { useEffect, useState } from "react";
import { Panel } from "@/components/admin/Shell";

const DEFAULT_TRACKS = [
  { value: "global-policy", label: "Global Policy Dialogue" }, { value: "climate", label: "Climate & Sustainability Forum" },
  { value: "technology", label: "Technology & Society Lab" }, { value: "entrepreneurship", label: "Youth Entrepreneurship Track" },
  { value: "human-rights", label: "Human Rights Council" }, { value: "press", label: "International Press Corps" },
  { value: "leadership", label: "Leadership & Diplomacy Summit" }, { value: "crisis", label: "Continuous Crisis Committee" }
];
const STATE: Record<string, string> = { AVAILABLE: "Available", HELD: "On hold", ASSIGNED: "Assigned" };

export default function Page() {
  const [tracks, setTracks] = useState<{ value: string; label: string }[]>([]);
  async function fetchTracks() {
    try {
      const r = await fetch("/api/public/tracks");
      if (r.ok) setTracks(await r.json());
    } catch (_) { /* ignore */ }
  }
  useEffect(() => { void fetchTracks(); }, []);
  return (
    <AdminShell title="Portfolios">
      <BulkAdd tracks={tracks} refreshTracks={fetchTracks} />
      <BulkDelete tracks={tracks} refreshTracks={fetchTracks} />
      <CrudManager
        endpoint="/api/admin/portfolios"
        bulkDelete={true}
        newLabel="Portfolio"
        hasPublished={false}
        columns={[
          { key: "name", label: "Portfolio", render: (r) => <span className="font-600 text-ink">{r.name}</span> },
          { key: "trackSlug", label: "Committee", render: (r) => tracks.find((t) => t.value === r.trackSlug)?.label || r.trackSlug },
          { key: "status", label: "Status", render: (r) => STATE[r.status] || r.status },
          { key: "order", label: "Order" }
        ]}
        fields={[
          { name: "trackSlug", label: "Committee", type: "select", options: tracks, required: true },
          { name: "name", label: "Portfolio (country / role)", required: true },
          { name: "order", label: "Sort order", type: "number" }
        ]}
      />
    </AdminShell>
  );
}

function BulkDelete({ tracks, refreshTracks }: { tracks: { value: string; label: string }[]; refreshTracks: () => Promise<void> }) {
  const [trackSlug, setTrackSlug] = useState<string | undefined>(undefined);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => { if (!trackSlug && tracks?.length) setTrackSlug(tracks[0].value); }, [tracks]);

  async function run() {
    setBusy(true); setMsg("");
    const names = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!names.length || !trackSlug) { setMsg("No committee selected or no portfolio names provided."); setBusy(false); return; }
    const res = await fetch("/api/admin/portfolios/bulk-delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trackSlug, names }) });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setText("");
      setMsg(`Deleted ${d.deleted || 0}. ${d.notFound?.length ? `${d.notFound.length} not found` : ""}`);
      await refreshTracks();
    } else setMsg(d.error || "Bulk delete failed.");
  }

  return (
    <Panel title="Bulk delete portfolios">
      <p className="mb-3 text-sm text-slatey">Paste portfolio names (one per line) to archive them in the selected committee.</p>
      <div className="mb-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search committee" className="mb-2 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 sm:w-80" />
        <select value={trackSlug} onChange={(e) => setTrackSlug(e.target.value)} className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 sm:w-80">
          {tracks.filter((t) => t.label.toLowerCase().includes(search.toLowerCase()) || t.value.toLowerCase().includes(search.toLowerCase())).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder={"United States\nUnited Kingdom\nFrance\n..."} className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 font-mono text-sm outline-none focus:border-gold" />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={run} disabled={busy} className="rounded-full bg-red-600 px-6 py-2.5 font-600 text-cream hover:bg-red-500 disabled:opacity-60">{busy ? "Deleting…" : "Delete portfolios"}</button>
        {msg && <p className="text-sm text-ink/70">{msg}</p>}
      </div>
    </Panel>
  );
}

function BulkAdd({ tracks, refreshTracks }: { tracks: { value: string; label: string }[]; refreshTracks: () => Promise<void> }) {
  const [trackSlug, setTrackSlug] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<"committee" | "csv">("committee");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [search, setSearch] = useState("");

  useEffect(() => { if (!trackSlug && tracks?.length) setTrackSlug(tracks[0].value); }, [tracks]);

  async function run() {
    setBusy(true); setMsg("");
    if (mode === "committee" && !trackSlug) { setMsg("Choose a committee"); setBusy(false); return; }
    const body = { trackSlug, text };
    const res = await fetch("/api/admin/portfolios/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
      if (res.ok) {
      setText("");
      setMsg(`Added ${d.created}, skipped ${d.skipped} duplicate(s)${d.errors ? `, ${d.errors} error(s)` : ""}.`);
        await refreshTracks();
    } else setMsg(d.error || "Bulk import failed.");
  }

  return (
    <Panel title="Bulk add portfolios">
      <p className="mb-3 text-sm text-slatey">Paste a long list once instead of adding portfolios one by one. Duplicates are skipped automatically.</p>
      <div className="mb-3 flex gap-2">
        <button onClick={() => setMode("committee")} className={`rounded-full px-3 py-1.5 text-xs font-600 ${mode === "committee" ? "bg-midnight text-cream" : "border border-ink/15 text-ink/70"}`}>One committee · names</button>
        <button onClick={() => setMode("csv")} className={`rounded-full px-3 py-1.5 text-xs font-600 ${mode === "csv" ? "bg-midnight text-cream" : "border border-ink/15 text-ink/70"}`}>Mixed · committee, name</button>
      </div>
      {mode === "committee" && (
        <div className="mb-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search committee" className="mb-2 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 sm:w-80" />
          <select value={trackSlug} onChange={(e) => setTrackSlug(e.target.value)} className="mb-3 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 sm:w-80">
            {tracks.filter((t) => t.label.toLowerCase().includes(search.toLowerCase()) || t.value.toLowerCase().includes(search.toLowerCase())).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      )}
      <textarea
        value={text} onChange={(e) => setText(e.target.value)} rows={8}
        placeholder={mode === "committee" ? "United States\nUnited Kingdom\nFrance\n..." : "global-policy, United States\nclimate, Brazil\ncrisis, Minister of Defence\n..."}
        className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 font-mono text-sm outline-none focus:border-gold"
      />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={run} disabled={busy} className="rounded-full bg-gold px-6 py-2.5 font-600 text-midnight hover:bg-goldlite disabled:opacity-60">{busy ? "Importing…" : "Import portfolios"}</button>
        {msg && <p className="text-sm text-ink/70">{msg}</p>}
      </div>
    </Panel>
  );
}
