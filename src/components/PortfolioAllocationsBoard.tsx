"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const POLL_MS = 30000;

type Portfolio = { name: string; taken: boolean; archived?: boolean };
type Committee = { slug: string; name: string; total: number; taken: number; portfolios: Portfolio[] };
type Payload = { committees: Committee[]; generatedAt: string };

export default function PortfolioAllocationsBoard() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("all");
  const [secsAgo, setSecsAgo] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/public/portfolios", { cache: "no-store" });
      const json: Payload = await res.json();
      setData(json); setError(false); setSecsAgo(0);
    } catch { setError(true); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    fetchData();
    timer = setInterval(() => { if (!document.hidden) fetchData(); }, POLL_MS);
    const onVis = () => { if (!document.hidden) fetchData(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVis); };
  }, [fetchData]);
  useEffect(() => { const t = setInterval(() => setSecsAgo((s) => s + 1), 1000); return () => clearInterval(t); }, [data]);

  const committees = (data?.committees ?? []).filter((c) => filter === "all" || c.slug === filter);
  const totalTaken = (data?.committees ?? []).reduce((s, c) => s + c.taken, 0);
  const totalSeats = (data?.committees ?? []).reduce((s, c) => s + c.total, 0);

  if (loading) {
    return <div className="mt-6 grid gap-5 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-ink/5" />)}</div>;
  }
  if (!data || data.committees.length === 0) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-paper p-10 text-center">
        <p className="font-display text-2xl font-700 text-ink">Portfolios open for allocation</p>
        <p className="mt-2 text-ink/65">As delegates confirm their seats, allocated portfolios will fill in here live.</p>
        <Link href="/register" className="mt-5 inline-block rounded-full bg-gold px-6 py-3 font-600 text-midnight hover:bg-goldlite">Register</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-ink/70" aria-live="polite">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" />
          </span>
          {error ? "Reconnecting..." : `Live - ${totalTaken}/${totalSeats} portfolios allotted - updated ${secsAgo}s ago`}
        </div>
        <button onClick={fetchData} className="rounded-full border border-ink/15 px-4 py-1.5 text-sm font-500 text-ink hover:border-gold">Refresh</button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>All committees</Chip>
        {(data.committees ?? []).map((c) => <Chip key={c.slug} active={filter === c.slug} onClick={() => setFilter(c.slug)}>{c.name}</Chip>)}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {committees.map((c) => {
          const pct = c.total ? Math.round((c.taken / c.total) * 100) : 0;
          return (
            <article key={c.slug} className="overflow-hidden rounded-2xl border border-ink/10 bg-paper">
              <div className="border-b border-ink/5 px-5 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-700 text-ink">{c.name}</h3>
                  <span className="text-xs tabular-nums text-slatey">{c.taken}/{c.total} allotted</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} /></div>
              </div>
              <div className="flex flex-wrap gap-1.5 p-4">
                {c.portfolios.map((p) => (
                  <span key={p.name} title={p.archived ? "Archived" : p.taken ? "Allotted" : "Available"}
                    className={`rounded-md px-2 py-1 text-xs font-500 ${p.archived ? "bg-slate-100 text-slate-500 ring-1 ring-slate-300" : p.taken ? "bg-midnight text-cream" : "bg-cream text-ink/70 ring-1 ring-ink/10"}`}>
                    {p.name}{p.archived ? " (archived)" : ""}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-6 text-sm text-ink/60">
        Dark chips are already allotted; light chips are still open. <Link href="/register" className="font-600 text-gold hover:underline">Pick your portfolio -&gt;</Link>
      </p>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-full px-3.5 py-1.5 text-xs font-500 transition ${active ? "bg-midnight text-cream" : "border border-ink/15 bg-paper text-ink/70 hover:border-gold"}`}>
      {children}
    </button>
  );
}
