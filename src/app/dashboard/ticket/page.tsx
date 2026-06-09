"use client";
import { useEffect, useState } from "react";

type Ticket = { delegateId: string; fullName: string; trackName: string; qr: string };

export default function TicketPage() {
  const [t, setT] = useState<Ticket | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/delegate/ticket").then(async (r) => {
      if (r.ok) setT(await r.json());
      else setErr((await r.json().catch(() => ({}))).error || "Ticket unavailable.");
    });
  }, []);

  if (err) return <p className="text-ink/70">{err}</p>;
  if (!t) return <p className="text-slatey">Loading ticket…</p>;

  return (
    <div className="mx-auto max-w-sm">
      <div className="overflow-hidden rounded-3xl border border-ink/10 bg-paper shadow-xl print:shadow-none">
        <div className="bg-midnight px-6 py-5 text-center text-cream">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Delegate Ticket</p>
          <p className="mt-1 font-display text-xl font-700">New Delhi Global Youth Summit</p>
          <p className="text-xs text-cream/60">22–23 August 2026 · IIT Delhi</p>
        </div>
        <div className="p-6 text-center">
          <img src={t.qr} alt="Check-in QR" className="mx-auto h-56 w-56" />
          <p className="mt-4 font-mono text-lg font-700 text-ink">{t.delegateId}</p>
          <p className="mt-1 font-display text-lg text-ink">{t.fullName}</p>
          <p className="text-sm text-slatey">{t.trackName}</p>
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <button onClick={() => window.print()} className="flex-1 rounded-full bg-midnight py-3 font-600 text-cream hover:bg-royal">Print ticket</button>
        <a href="/api/delegate/badge" className="flex-1 rounded-full border border-ink/20 py-3 text-center font-600 text-ink hover:border-gold">Download badge (PDF)</a>
      </div>
      <a href="/api/delegate/calendar" className="mt-3 block rounded-full border border-ink/20 py-3 text-center font-600 text-ink hover:border-gold">Add to calendar (.ics)</a>
      <p className="mt-3 text-center text-xs text-slatey">This ticket works offline once you've opened it on this device.</p>
    </div>
  );
}
