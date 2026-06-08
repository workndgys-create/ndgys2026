"use client";
import { useEffect, useRef, useState } from "react";

type Ann = { id: string; title: string; body: string; publishedAt: string };

export default function LiveAnnouncements() {
  const [items, setItems] = useState<Ann[]>([]);
  const [live, setLive] = useState(false);
  const seen = useRef<Set<string>>(new Set());

  function merge(incoming: Ann[]) {
    setItems((cur) => {
      const map = new Map(cur.map((a) => [a.id, a]));
      for (const a of incoming) map.set(a.id, a);
      return Array.from(map.values()).sort((x, y) => +new Date(y.publishedAt) - +new Date(x.publishedAt)).slice(0, 50);
    });
    incoming.forEach((a) => seen.current.add(a.id));
  }

  useEffect(() => {
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;

    try {
      es = new EventSource("/api/delegate/announcements/stream");
      es.addEventListener("snapshot", (e) => { setLive(true); merge(JSON.parse((e as MessageEvent).data)); });
      es.addEventListener("new", (e) => merge(JSON.parse((e as MessageEvent).data)));
      es.onerror = () => {
        setLive(false); es?.close();
        if (!poll) poll = setInterval(refetch, 30000);
        refetch();
      };
    } catch {
      poll = setInterval(refetch, 30000); refetch();
    }

    async function refetch() {
      try { const r = await fetch("/api/delegate/announcements"); if (r.ok) merge((await r.json()).announcements || []); } catch {}
    }

    return () => { es?.close(); if (poll) clearInterval(poll); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="font-display text-xl font-700 text-ink">Announcements</h2>
        {live && <span className="flex items-center gap-1 text-xs text-green-700"><span className="h-2 w-2 animate-pulse rounded-full bg-green-600" />live</span>}
      </div>
      <div className="space-y-2">
        {items.map((a) => (
          <div key={a.id} className="rounded-xl border border-ink/10 bg-paper p-4">
            <div className="flex items-center justify-between">
              <p className="font-600 text-ink">{a.title}</p>
              <span className="text-xs text-slatey">{new Date(a.publishedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <p className="mt-1 text-sm text-ink/75">{a.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
