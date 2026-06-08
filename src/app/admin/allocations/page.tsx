"use client";
import { useCallback, useEffect, useState } from "react";
import AdminShell, { Panel } from "@/components/admin/Shell";

type Reg = { id: string; fullName: string; delegateId: string | null; portfolio: string | null };

const TRACKS: [string, string][] = [
  ["global-policy", "Global Policy Dialogue"], ["climate", "Climate & Sustainability Forum"],
  ["technology", "Technology & Society Lab"], ["entrepreneurship", "Youth Entrepreneurship Track"],
  ["human-rights", "Human Rights Council"], ["press", "International Press Corps"],
  ["leadership", "Leadership & Diplomacy Summit"], ["crisis", "Continuous Crisis Committee"]
];

export default function AllocationsAdmin() {
  const [track, setTrack] = useState(TRACKS[0][0]);
  const [rows, setRows] = useState<Reg[] | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setRows(null);
    fetch(`/api/admin/registrations?track=${track}&status=PAID&pageSize=100`)
      .then(async (r) => {
        const d = await r.json();
        const items: Reg[] = (d.items || []).map((x: any) => ({ id: x.id, fullName: x.fullName, delegateId: x.delegateId, portfolio: x.portfolio }));
        setRows(items);
        setDraft(Object.fromEntries(items.map((i) => [i.id, i.portfolio ?? ""])));
      });
  }, [track]);
  useEffect(load, [load]);

  async function save(id: string) {
    setSavingId(id);
    const res = await fetch(`/api/admin/registrations/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ portfolio: draft[id] })
    });
    setSavingId(null);
    if (res.ok) {
      setRows((cur) => cur?.map((r) => (r.id === id ? { ...r, portfolio: draft[id] || null } : r)) ?? cur);
      setSavedId(id); setTimeout(() => setSavedId((s) => (s === id ? null : s)), 1500);
    }
  }

  const assigned = rows?.filter((r) => r.portfolio).length ?? 0;

  return (
    <AdminShell title="Portfolio allocations">
      <Panel
        title="Assign portfolios"
        action={
          <select value={track} onChange={(e) => setTrack(e.target.value)} className="rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold">
            {TRACKS.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
          </select>
        }
      >
        <p className="mb-4 text-sm text-slatey">
          Enter each delegate's country / role. Saved allocations appear live on the home page when <b>Settings → Allocations live</b> is on.
          {rows && <> · <b>{assigned}/{rows.length}</b> assigned in this committee.</>}
        </p>

        {!rows ? (
          <p className="text-slatey">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-slatey">No paid delegates in this committee yet.</p>
        ) : (
          <ul className="divide-y divide-ink/5">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-[180px] flex-1">
                  <p className="font-600 text-ink">{r.fullName}</p>
                  <p className="font-mono text-xs text-slatey">{r.delegateId || "—"}</p>
                </div>
                <input
                  value={draft[r.id] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") save(r.id); }}
                  placeholder="e.g. France / Editor-in-Chief"
                  className="min-w-[200px] flex-1 rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold"
                />
                <button
                  onClick={() => save(r.id)}
                  disabled={savingId === r.id || (draft[r.id] ?? "") === (r.portfolio ?? "")}
                  className="rounded-full bg-midnight px-4 py-2 text-sm font-600 text-cream hover:bg-royal disabled:opacity-40"
                >
                  {savingId === r.id ? "Saving…" : savedId === r.id ? "Saved ✓" : "Save"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AdminShell>
  );
}
