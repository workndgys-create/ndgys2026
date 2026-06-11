"use client";
import { useEffect, useState } from "react";

type Row = { portfolio: string; filled: boolean; delegate: string | null; isMe: boolean };
type Roster = { trackName: string; filled: number; total: number; rows: Row[] };

export default function Page() {
  const [r, setR] = useState<Roster | null>(null);
  const [optIn, setOptIn] = useState(true);
  const [err, setErr] = useState("");

  function load() {
    fetch("/api/delegate/roster").then(async (res) => {
      if (res.ok) { const d = await res.json(); setR(d); const me = d.rows.find((x: Row) => x.isMe); if (me) setOptIn(me.delegate !== "Assigned"); }
      else setErr((await res.json().catch(() => ({}))).error || "Roster unavailable.");
    });
  }
  useEffect(load, []);

  async function toggle() {
    const next = !optIn; setOptIn(next);
    await fetch("/api/delegate/roster-optin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ optIn: next }) });
    load();
  }

  if (err) return <p className="text-ink/70">{err}</p>;
  if (!r) return <p className="text-slatey">Loading roster…</p>;

  return (
    <div>
      <h1 className="font-display text-3xl font-700 text-ink">{r.trackName}</h1>
      <p className="mt-1 text-ink/70">{r.filled} of {r.total} portfolios filled.</p>

      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-paper px-4 py-2.5 text-sm">
        <input type="checkbox" checked={optIn} onChange={toggle} className="accent-gold" />
        Show my name on the committee roster
      </label>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {r.rows.map((row) => (
          <div key={row.portfolio} className={`flex items-center justify-between rounded-xl border p-3 ${row.isMe ? "border-gold/60 bg-goldlite/20" : row.filled ? "border-ink/10 bg-paper" : "border-dashed border-ink/15 bg-cream"}`}>
            <span className="font-500 text-ink">{row.portfolio}</span>
            <span className="text-sm text-slatey">{row.isMe ? "You" : row.filled ? (row.delegate || "Assigned") : "Open"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
