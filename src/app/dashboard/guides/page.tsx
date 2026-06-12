"use client";
import { useEffect, useState } from "react";

type Guide = { id: string; title: string; fileName: string; sizeBytes: number; uploadedAt: string };

function kb(n: number) { return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`; }

export default function Page() {
  const [guides, setGuides] = useState<Guide[] | null>(null);
  const [bg, setBg] = useState<Guide[] | null>(null);
  const [locked, setLocked] = useState(false);
  const [trackName, setTrackName] = useState("");
  const [isComp, setIsComp] = useState(false);

  useEffect(() => {
    fetch("/api/delegate/guides").then(async (r) => {
      const d = await r.json().catch(() => ({}));
      setLocked(!!d.locked); setGuides(d.guides || []); setTrackName(d.trackName || "");
      setIsComp(!!d.isCompetition);
    });
    fetch("/api/delegate/background-guides").then(async (r) => {
      const d = await r.json().catch(() => ({}));
      setBg(d.guides || []);
    });
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-700 text-ink">Rules & Regulations</h1>
      {trackName && <p className="mt-1 text-ink/70">Rules & regulations for <b>{trackName}</b>.</p>}

      {!locked && !isComp && bg && bg.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-xl font-700 text-ink">Background guides (MUN)</h2>
          <div className="mt-2 space-y-2">
            {bg.map((g) => (
              <a key={g.id} href={`/api/delegate/background-guides/${g.id}`} className="flex items-center justify-between rounded-xl border border-gold/40 bg-goldlite/15 p-4 hover:border-gold">
                <div>
                  <p className="font-600 text-ink">{g.title}</p>
                  <p className="text-xs text-slatey">{g.fileName} · {kb(g.sizeBytes)}</p>
                </div>
                <span className="rounded-full bg-midnight px-4 py-2 text-sm font-600 text-cream">Download</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <h2 className="mt-8 font-display text-xl font-700 text-ink">Rules & Regulations</h2>
      {locked ? (
        <p className="mt-6 rounded-xl border border-ink/10 bg-paper p-6 text-ink/70">Rules & Regulations unlock once your registration is paid.</p>
      ) : !guides ? (
        <p className="mt-6 text-slatey">Loading…</p>
      ) : guides.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-ink/15 bg-cream p-6 text-slatey">No rules & regulations have been published for your committee or competition yet — check back soon.</p>
      ) : (
        <div className="mt-6 space-y-2">
          {guides.map((g) => (
            <a key={g.id} href={`/api/delegate/guides/${g.id}`} className="flex items-center justify-between rounded-xl border border-ink/10 bg-paper p-4 hover:border-gold">
              <div>
                <p className="font-600 text-ink">{g.title}</p>
                <p className="text-xs text-slatey">{g.fileName} · {kb(g.sizeBytes)}</p>
              </div>
              <span className="rounded-full bg-midnight px-4 py-2 text-sm font-600 text-cream">Download</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
