"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminShell, { Panel } from "@/components/admin/Shell";

type Result = {
  id: string;
  refId: string;
  leaderName: string;
  competitionTitle: string;
  checkedIn: boolean;
};

type RecentScan = {
  id: string;
  scannedAt: string;
  action: string;
  registration: {
    id: string;
    refId: string;
    leaderName: string;
    competitionTitle: string;
  } | null;
};

export default function CheckinPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [counts, setCounts] = useState<{ day1: number; day2: number; total: number } | null>(null);
  const [recent, setRecent] = useState<RecentScan[]>([]);
  const [scanDay, setScanDay] = useState<1 | 2>(1);
  const [autoScan, setAutoScan] = useState(true);
  const [scanMessage, setScanMessage] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadCounts() {
      const r = await fetch(`/api/admin/competition-checkin`);
      if (r.status === 401) return router.push("/admin/login");
      const data = await r.json();
      if (!mounted) return;
      setCounts(data.day1Count !== undefined ? { day1: data.day1Count, day2: data.day2Count, total: data.totalUnique } : null);
      setRecent(data.recent || []);
    }
    loadCounts();
    return () => {
      mounted = false;
    };
  }, [router]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setScanMessage("");
    const r = await fetch(`/api/admin/competition-checkin?q=${encodeURIComponent(q.trim())}`);
    if (r.status === 401) return router.push("/admin/login");
    const data = await r.json();
    setResults(data.results || []);
    setCounts(
      data.day1Count !== undefined ? { day1: data.day1Count, day2: data.day2Count, total: data.totalUnique } : null
    );
    setRecent(data.recent || []);
    setSearched(true);

    // Scanner flow: when exactly one paid registration matches, auto check-in it.
    if (autoScan && Array.isArray(data.results) && data.results.length === 1) {
      const reg = data.results[0] as Result;
const alreadyChecked = reg.checkedIn;      
if (!alreadyChecked) {
        const markRes = await fetch("/api/admin/competition-checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: q.trim(), day: scanDay, value: true })
        });
        if (markRes.ok) {
              const payload = await markRes.json();
              if (payload.alreadyCheckedIn) {
                setScanMessage(`${reg.leaderName} was already checked in.`);              
} else {
                setCounts({ day1: payload.day1Count, day2: payload.day2Count, total: payload.totalUnique });
                setRecent(payload.recent || []);
                setResults((cur) =>
  cur.map((x) =>
    x.id === reg.id
      ? {
          ...x,
          checkedIn: true,
        }
      : x
  )
);
                setScanMessage(`Auto check-in done for ${reg.leaderName}.`);
              }
        }
      } else {
        setScanMessage(`${reg.leaderName} is already checked in.`);
      }
    }

    setQ("");
  }

  async function mark(id: string, day: 1 | 2, value: boolean) {
    const r = await fetch("/api/admin/competition-checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (r.ok) {
      const payload = await r.json();
      if (payload.alreadyCheckedIn) {
        setScanMessage(`Already checked in at ${payload.when || "an earlier time"}.`);
      } else {
        setResults((cur) =>
  cur.map((x) =>
    x.id === id
      ? {
          ...x,
          checkedIn: true,
        }
      : x
  )
);

setScanMessage("Participant checked in successfully.");     
    }
  }

  return (
    <AdminShell title="Check-in">
      <Panel
        title="Find a delegate"
        action={
          counts ? (
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-paper px-3 py-2 text-center">
                <div className="text-lg font-700 text-ink">{counts.day1}</div>
                <div className="text-xs text-slatey">Day 1 Checked In</div>
              </div>
              <div className="rounded-xl bg-paper px-3 py-2 text-center">
                <div className="text-lg font-700 text-ink">{counts.day2}</div>
                <div className="text-xs text-slatey">Day 2 Checked In</div>
              </div>
              <div className="rounded-xl bg-paper px-3 py-2 text-center">
                <div className="text-lg font-700 text-ink">{counts.total}</div>
                <div className="text-xs text-slatey">Total Unique Checked In</div>
              </div>
            </div>
          ) : null
        }
      >
        <form onSubmit={search} className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            placeholder="Scan QR or type competition reference ID”            className="flex-1 rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
          <button className="rounded-full bg-midnight px-6 py-2.5 text-sm font-600 text-cream hover:bg-royal">Search</button>
        </form>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slatey">
          <p>A QR scanner can paste the ParticipantURL or ID. If one match is found, it will auto check-in.</p>
          <label className="inline-flex items-center gap-2">
            <span>Scan day</span>
            <select value={scanDay} onChange={(e) => setScanDay(Number(e.target.value) === 2 ? 2 : 1)} className="rounded-md border border-ink/15 bg-cream px-2 py-1 text-xs">
              <option value={1}>Day 1</option>
              <option value={2}>Day 2</option>
            </select>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={autoScan} onChange={(e) => setAutoScan(e.target.checked)} />
            <span>Auto check-in on scan</span>
          </label>
        </div>
        {scanMessage && <p className="mt-2 text-sm text-emerald-700">{scanMessage}</p>}
      </Panel>

      <div className="mt-5 space-y-3">
        {searched && results.length === 0 && <p className="rounded-2xl border border-ink/10 bg-paper p-6 text-center text-slatey">No paid competition participant found.</p>}
        {results.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-paper p-5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-14 overflow-hidden rounded-lg border border-ink/15 bg-cream flex items-center justify-center shrink-0 shadow-sm">
                <img
                  src={`/api/CompetitionPhoto/${r.id}/photo`}
                  alt=""
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%239CA3AF"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
                  }}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="font-display text-lg font-700 text-ink">
  {r.leaderName}
</p>

<p className="font-mono text-xs text-slatey">
  {r.refId}
</p>

<p className="text-sm text-slatey">
  {r.competitionTitle}
</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
  onClick={() => mark(r.id, 1, true)}
  className={`rounded-xl px-5 py-3 text-sm font-600 transition ${
    r.checkedIn
      ? "bg-green-600 text-white"
      : "border border-ink/15 bg-cream text-ink hover:border-gold"
  }`}
>
  {r.checkedIn ? "✓ Checked In" : "Check In"}
</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <Panel title="Recent scan check-ins">
        {recent.length === 0 ? (
          <p className="text-sm text-slatey">No scan activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slatey">
                <tr>
                  <th className="px-2 py-2">Time</th>
                  <th className="px-2 py-2">Reference ID</th>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Competition</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {recent.map((x) => (
                  <tr key={x.id}>
                    <td className="px-2 py-2 text-slatey">{new Date(x.scannedAt).toLocaleString()}</td>
                    <td className="px-2 py-2 font-mono text-xs">{x.registration?.refId || "—"}</td>
                    <td className="px-2 py-2">{x.registration?.leaderName || "Unknown"}</td>
                    <td className="px-2 py-2">{x.registration?.competitionTitle || "—"}</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </Panel>
      </div>
    </AdminShell>
  );
}


