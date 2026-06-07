"use client";
import AdminShell from "@/components/admin/Shell";
import CrudManager from "@/components/admin/Crud";
import { useState } from "react";
import { Panel } from "@/components/admin/Shell";

const TRACK_OPTIONS = [
  { value: "global-policy", label: "Global Policy Dialogue" }, { value: "climate", label: "Climate & Sustainability Forum" },
  { value: "technology", label: "Technology & Society Lab" }, { value: "entrepreneurship", label: "Youth Entrepreneurship Track" },
  { value: "human-rights", label: "Human Rights Council" }, { value: "press", label: "International Press Corps" },
  { value: "leadership", label: "Leadership & Diplomacy Summit" }, { value: "crisis", label: "Continuous Crisis Committee" }
];
const STATE: Record<string, string> = { AVAILABLE: "Available", HELD: "On hold", ASSIGNED: "Assigned" };

export default function Page() {
  return (
    <AdminShell title="Portfolios">
      <BulkAdd />
      <CrudManager
        endpoint="/api/admin/portfolios"
        newLabel="Portfolio"
        hasPublished={false}
        columns={[
          { key: "name", label: "Portfolio", render: (r) => <span className="font-600 text-ink">{r.name}</span> },
          { key: "trackSlug", label: "Committee", render: (r) => TRACK_OPTIONS.find((t) => t.value === r.trackSlug)?.label || r.trackSlug },
          { key: "status", label: "Status", render: (r) => STATE[r.status] || r.status },
          { key: "order", label: "Order" }
        ]}
        fields={[
          { name: "trackSlug", label: "Committee", type: "select", options: TRACK_OPTIONS, required: true },
          { name: "name", label: "Portfolio (country / role)", required: true },
          { name: "order", label: "Sort order", type: "number" }
        ]}
      />
    </AdminShell>
  );
}

function BulkAdd() {
  const [trackSlug, setTrackSlug] = useState(TRACK_OPTIONS[0].value);
  const [mode, setMode] = useState<"committee" | "csv">("committee");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function run() {
    setBusy(true); setMsg("");
    const body = mode === "committee" ? { trackSlug, text } : { text };
    const res = await fetch("/api/admin/portfolios/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setText("");
      setMsg(`Added ${d.created}, skipped ${d.skipped} duplicate(s)${d.unresolved?.length ? `, ${d.unresolved.length} line(s) could not be matched` : ""}.`);
      setTimeout(() => location.reload(), 900);
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
        <select value={trackSlug} onChange={(e) => setTrackSlug(e.target.value)} className="mb-3 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 sm:w-80">
          {TRACK_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
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
