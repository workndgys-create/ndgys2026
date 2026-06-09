"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell, { Panel } from "@/components/admin/Shell";

type Result = { id: string; delegateId: string | null; fullName: string; trackName: string; checkedInDay1: boolean; checkedInDay2: boolean };

export default function CheckinPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [counts, setCounts] = useState<{ day1: number; day2: number; total: number } | null>(null);
  const [searched, setSearched] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    const r = await fetch(`/api/admin/checkin?q=${encodeURIComponent(q.trim())}`);
    if (r.status === 401) return router.push("/admin/login");
    const data = await r.json();
    setResults(data.results || []);
    setCounts(
      data.day1Count !== undefined ? { day1: data.day1Count, day2: data.day2Count, total: data.totalUnique } : null
    );
    setSearched(true);
  }

  async function mark(id: string, day: 1 | 2, value: boolean) {
    const r = await fetch("/api/admin/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, day, value })
    });
    if (r.ok) {
      const { registration, day1Count, day2Count, totalUnique } = await r.json();
      setResults((cur) => cur.map((x) => (x.id === id ? { ...x, checkedInDay1: registration.checkedInDay1, checkedInDay2: registration.checkedInDay2 } : x)));
      setCounts({ day1: day1Count, day2: day2Count, total: totalUnique });
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
            placeholder="Scan QR or type delegate ID / email"
            className="flex-1 rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
          <button className="rounded-full bg-midnight px-6 py-2.5 text-sm font-600 text-cream hover:bg-royal">Search</button>
        </form>
        <p className="mt-2 text-xs text-slatey">A QR scanner will type the delegate URL — the ID is matched automatically.</p>
      </Panel>

      <div className="mt-5 space-y-3">
        {searched && results.length === 0 && <p className="rounded-2xl border border-ink/10 bg-paper p-6 text-center text-slatey">No paid delegate found.</p>}
        {results.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-paper p-5">
            <div>
              <p className="font-display text-lg font-700 text-ink">{r.fullName}</p>
              <p className="font-mono text-xs text-slatey">{r.delegateId}</p>
              <p className="text-sm text-slatey">{r.trackName}</p>
            </div>
            <div className="flex gap-2">
              <DayToggle label="Day 1" on={r.checkedInDay1} onClick={() => mark(r.id, 1, !r.checkedInDay1)} />
              <DayToggle label="Day 2" on={r.checkedInDay2} onClick={() => mark(r.id, 2, !r.checkedInDay2)} />
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

function DayToggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-5 py-3 text-sm font-600 transition ${on ? "bg-[#D97706] text-midnight" : "border border-ink/15 bg-cream text-ink hover:border-gold"}`}
    >
      {on ? "✓ " : ""}{label}
    </button>
  );
}
