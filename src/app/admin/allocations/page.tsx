"use client";
import { useCallback, useEffect, useState } from "react";
import AdminShell, { Panel } from "@/components/admin/Shell";

type Reg = { id: string; fullName: string; delegateId: string | null; portfolio: string | null };

// load active tracks from public API

export default function AllocationsAdmin() {
  const [tracks, setTracks] = useState<{ value: string; label: string }[]>([]);
  const [track, setTrack] = useState("");
  const [committees, setCommittees] = useState<
    { slug: string; name: string; total: number; taken: number; portfolios: { name: string; taken: boolean }[] }[]
  >([]);
  const [rows, setRows] = useState<Reg[] | null>(null);

  const load = useCallback(() => {
    setRows(null);
    fetch(`/api/admin/registrations?track=${track}&status=PAID&pageSize=100`)
      .then(async (r) => {
        const d = await r.json();
        const items: Reg[] = (d.items || []).map((x: any) => ({ id: x.id, fullName: x.fullName, delegateId: x.delegateId, portfolio: x.portfolio }));
        setRows(items);
      });
  }, [track]);
  useEffect(load, [load]);
  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/public/tracks");
        if (r.ok) {
          const t = await r.json();
          setTracks(t);
          if (!track && t.length) setTrack(t[0].value);
        }
      } catch (_) { }
    })();
    void (async () => {
      try {
        const r = await fetch(`/api/public/portfolios`);
        if (r.ok) {
          const d = await r.json();
          setCommittees(d.committees || []);
        }
      } catch (_) { }
    })();
  }, []);

  const assigned = rows?.filter((r) => r.portfolio).length ?? 0;

  return (
    <AdminShell title="Portfolio allocations">
      <Panel
        title="Assigned portfolios"
        action={
          <select value={track} onChange={(e) => setTrack(e.target.value)} className="rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold">
            {tracks.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        }
      >
        <p className="mb-4 text-sm text-slatey">
          Read-only view of participant-selected portfolios. Portfolios are assigned only through the registration form.
          {rows && <> · <b>{assigned}/{rows.length}</b> assigned in this committee.</>}
        </p>

        {committees.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {committees.map((c) => (
              <button
                key={c.slug}
                onClick={() => setTrack(c.slug)}
                className={`rounded-full border px-3 py-1 text-sm ${track === c.slug ? "bg-midnight text-cream" : "bg-cream text-ink"}`}
              >
                <span className="font-600">{c.name}</span>
                <span className="ml-2 text-xs text-slatey">{c.taken}/{c.total}</span>
              </button>
            ))}
          </div>
        )}

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
                <div className={`min-w-[220px] flex-1 rounded-lg border px-3 py-2 text-sm ${r.portfolio ? "border-ink/15 bg-cream text-ink" : "border-amber-300 bg-amber-50 text-amber-900"}`}>
                  {r.portfolio || "Not assigned yet"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AdminShell>
  );
}
