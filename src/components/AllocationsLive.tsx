"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const POLL_MS = 30_000;

type Allocation = { portfolio: string; delegateName: string; allocatedAt: string };
type Committee = { slug: string; name: string; capacity: number; allocatedCount: number; seatsRemaining: number; allocations: Allocation[] };
type Payload = { committees: Committee[]; generatedAt: string; published: boolean };

export default function AllocationsLive({ initialData }: { initialData?: Payload }) {
  const [data, setData] = useState<Payload | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [secsAgo, setSecsAgo] = useState(0);
  const seen = useRef<Set<string>>(new Set());
  const [flash, setFlash] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/allocations", { cache: "no-store" });
      const json: Payload = await res.json();
      // flash newly arrived allocations
      const next = new Set<string>();
      const fresh = new Set<string>();
      json.committees.forEach((c) => c.allocations.forEach((a) => {
        const key = `${c.slug}:${a.portfolio}`;
        next.add(key);
        if (seen.current.size && !seen.current.has(key)) fresh.add(key);
      }));
      seen.current = next;
      if (fresh.size) { setFlash(fresh); setTimeout(() => setFlash(new Set()), 2500); }
      setData(json); setError(false); setSecsAgo(0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // seed the "seen" set from initial data without flashing
    if (initialData) initialData.committees.forEach((c) => c.allocations.forEach((a) => seen.current.add(`${c.slug}:${a.portfolio}`)));
  }, [initialData]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    const start = () => { timer = setInterval(() => { if (!document.hidden) fetchData(); }, POLL_MS); };
    fetchData();
    start();
    const onVis = () => { if (!document.hidden) fetchData(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVis); };
  }, [fetchData]);

  useEffect(() => { const t = setInterval(() => setSecsAgo((s) => s + 1), 1000); return () => clearInterval(t); }, [data]);

  if (!loading && data && !data.published) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-paper p-10 text-center">
        <p className="font-display text-2xl font-700 text-ink">Portfolio allocations announced soon</p>
        <p className="mt-2 text-ink/65">Once committees are assigned, allocations will appear here live. Secure your seat in the meantime.</p>
        <Link href="/register" className="mt-5 inline-block rounded-full bg-gold px-6 py-3 font-600 text-midnight hover:bg-goldlite">Register</Link>
      </div>
    );
  }

  // Defensive: exclude any committee that represents IPL so it never appears in the Allocations UI
  const rawCommittees = (data?.committees ?? []).filter((c) => {
    const slug = String(c.slug || "").trim().toLowerCase();
    const name = String(c.name || "").trim().toLowerCase();
    if (!slug) return true;
    if (slug === "ipl" || slug.includes("ipl")) return false;
    if (name.includes("indian premier league") || name === "ipl") return false;
    return true;
  });
  const committees = rawCommittees.filter((c) => filter === "all" || c.slug === filter);
  const q = search.trim().toLowerCase();
  const filtered = committees
    .map((c) => ({ ...c, allocations: q ? c.allocations.filter((a) => a.portfolio.toLowerCase().includes(q) || a.delegateName.toLowerCase().includes(q)) : c.allocations }))
    .filter((c) => !q || c.allocations.length > 0);
  const totalAllocated = rawCommittees.reduce((s, c) => s + c.allocatedCount, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-ink/70" aria-live="polite">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" />
          </span>
          {error ? "Reconnecting…" : `Live · ${totalAllocated} allocated · updated ${secsAgo}s ago`}
        </div>
        <button onClick={fetchData} className="rounded-full border border-ink/15 px-4 py-1.5 text-sm font-500 text-ink hover:border-gold">Refresh</button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
      <Chip active={filter === "all"} onClick={() => setFilter("all")}>All committees</Chip>
      {rawCommittees.map((c) => <Chip key={c.slug} active={filter === c.slug} onClick={() => setFilter(c.slug)}>{c.name}</Chip>)}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search portfolio or delegate…"
          aria-label="Search allocations"
          className="ml-auto min-w-[200px] flex-1 rounded-full border border-ink/15 bg-paper px-4 py-1.5 text-sm outline-none focus:border-gold sm:flex-none"
        />
      </div>

      {loading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-ink/5" />)}</div>
      ) : filtered.every((c) => c.allocations.length === 0) ? (
        <p className="mt-8 rounded-2xl border border-ink/10 bg-paper p-8 text-center text-ink/60">No allocations match your search yet.</p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {filtered.map((c) => {
            const pct = c.capacity ? Math.min(100, Math.round((c.allocatedCount / c.capacity) * 100)) : 0;
            return (
              <article key={c.slug} className="overflow-hidden rounded-2xl border border-ink/10 bg-paper">
                <div className="border-b border-ink/5 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-700 text-ink">{c.name}</h3>
                    <span className="text-xs tabular-nums text-slatey">{c.allocatedCount}/{c.capacity}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} /></div>
                </div>
                <ul className="divide-y divide-ink/5">
                  {c.allocations.length === 0 ? (
                    <li className="px-5 py-4 text-sm text-slatey">Allocations pending.</li>
                  ) : c.allocations.map((a) => {
                    const key = `${c.slug}:${a.portfolio}`;
                    return (
                      <li key={key} className={`flex items-center justify-between px-5 py-2.5 text-sm transition-colors duration-700 ${flash.has(key) ? "bg-goldlite/40" : ""}`}>
                        <span className="font-600 text-ink">{a.portfolio}</span>
                        <span className="text-slatey">{a.delegateName}</span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-sm text-ink/60">
        Allocated your portfolio? <Link href="/dashboard" className="font-600 text-gold hover:underline">View it in your delegate dashboard →</Link>
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
