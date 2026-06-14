"use client";
import AdminShell from "@/components/admin/Shell";
import CrudManager from "@/components/admin/Crud";
import { useEffect, useState } from "react";
import { Panel } from "@/components/admin/Shell";

// tracks are loaded from /api/public/tracks
const STATE: Record<string, string> = { AVAILABLE: "Available", HELD: "On hold", ASSIGNED: "Assigned" };

export default function Page() {
  const [tracks, setTracks] = useState<{ value: string; label: string }[]>([]);
  const [groupedTracks, setGroupedTracks] = useState<string[]>([]);

  async function fetchTracks() {
    try {
      const r = await fetch("/api/public/tracks");
      if (r.ok) setTracks(await r.json());
    } catch (_) { /* ignore */ }
  }

  async function fetchSettings() {
    try {
      const r = await fetch("/api/admin/settings");
      if (r.ok) {
        const d = await r.json();
        const val = d.settings?.["portfolio.groupedTracks"] || "";
        setGroupedTracks(val.split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean));
      }
    } catch (_) { /* ignore */ }
  }

  useEffect(() => {
    void fetchTracks();
    void fetchSettings();
  }, []);

  async function toggleGroupedTrack(slug: string) {
    const slugLower = slug.toLowerCase();
    const nextList = groupedTracks.includes(slugLower)
      ? groupedTracks.filter((s) => s !== slugLower)
      : [...groupedTracks, slugLower];
    setGroupedTracks(nextList);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "portfolio.groupedTracks": nextList.join(",") })
    });
  }

  return (
    <AdminShell title="Portfolios">
      <Panel title="Nested sub-portfolios configuration">
        <p className="mb-4 text-sm text-slatey">
          Select committees where portfolios should be grouped and displayed in a two-stage dropdown during registration (e.g., Party first, then Candidate/Role). Portfolios in these committees should be created in the format <code>Parent - Child</code> (e.g. <code>Bharatiya Janata Party - Narendra Modi</code>).
        </p>
        {tracks.length === 0 ? (
          <p className="text-sm text-slatey">Loading committees...</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {tracks.map((t) => {
              const isChecked = groupedTracks.includes(t.value.toLowerCase());
              return (
                <label key={t.value} className="flex items-center gap-2 rounded-lg border border-ink/10 bg-cream p-3 text-sm font-500 text-ink cursor-pointer hover:border-gold">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleGroupedTrack(t.value)}
                    className="h-4 w-4 accent-gold"
                  />
                  <span>{t.label}</span>
                </label>
              );
            })}
          </div>
        )}
      </Panel>
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
          { name: "name", label: "Portfolio Name", required: true, placeholder: "e.g., USA or Bharatiya Janata Party - Narendra Modi" },
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
      <p className="mb-3 text-sm text-slatey">Paste portfolio names (one per line) to delete them from the selected committee.</p>
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
  const [parentGroup, setParentGroup] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => { if (!trackSlug && tracks?.length) setTrackSlug(tracks[0].value); }, [tracks]);

  async function run() {
    setBusy(true); setMsg("");
    if (mode === "committee" && !trackSlug) { setMsg("Choose a committee"); setBusy(false); return; }
    const body = { trackSlug, text, parentGroup: mode === "committee" && parentGroup.trim() ? parentGroup.trim() : undefined };
    const res = await fetch("/api/admin/portfolios/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setText("");
      setParentGroup("");
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
        <>
          <div className="mb-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search committee" className="mb-2 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 sm:w-80" />
            <select value={trackSlug} onChange={(e) => setTrackSlug(e.target.value)} className="mb-3 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 sm:w-80">
              {tracks.filter((t) => t.label.toLowerCase().includes(search.toLowerCase()) || t.value.toLowerCase().includes(search.toLowerCase())).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="mb-3 w-full sm:w-80">
            <label className="text-xs font-600 text-ink/75 block mb-1">Parent Group / Party / Organization (optional):</label>
            <input
              type="text"
              value={parentGroup}
              onChange={(e) => setParentGroup(e.target.value)}
              placeholder="e.g. Bharatiya Janata Party"
              className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
        </>
      )}
      <textarea
        value={text} onChange={(e) => setText(e.target.value)} rows={8}
        placeholder={mode === "committee" ? "United States\nUnited Kingdom\nFrance\n..." : "unsc, United States\nunga, Brazil\nwar-cabinet, Minister of Defence\n..."}
        className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 font-mono text-sm outline-none focus:border-gold"
      />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={run} disabled={busy} className="rounded-full bg-gold px-6 py-2.5 font-600 text-midnight hover:bg-goldlite disabled:opacity-60">{busy ? "Importing…" : "Import portfolios"}</button>
        {msg && <p className="text-sm text-ink/70">{msg}</p>}
      </div>
    </Panel>
  );
}
