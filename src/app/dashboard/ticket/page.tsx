"use client";
import { useEffect, useState } from "react";

type MemberTicket = { name: string; age?: number; delegateId: string; qr: string; hasPhoto: boolean };
type Ticket = { id: string; delegateId: string; fullName: string; trackName: string; qr: string; hasPhoto: boolean; isCompetition?: boolean; members?: MemberTicket[] };

export default function TicketPage() {
  const [t, setT] = useState<Ticket | null>(null);
  const [err, setErr] = useState("");
  const [photoStatuses, setPhotoStatuses] = useState<Record<number, boolean>>({});
  const [version, setVersion] = useState(0); // cache buster for image URL

  useEffect(() => {
    fetch("/api/delegate/ticket").then(async (r) => {
      if (r.ok) {
        const data = await r.json();
        setT(data);
        const statuses: Record<number, boolean> = { 0: data.hasPhoto };
        if (data.members) {
          data.members.forEach((m: any, idx: number) => {
            statuses[idx + 1] = m.hasPhoto;
          });
        }
        setPhotoStatuses(statuses);
      }
      else setErr((await r.json().catch(() => ({}))).error || "Ticket unavailable.");
    });
  }, []);

  if (err) return <p className="text-ink/70">{err}</p>;
  if (!t) return <p className="text-slatey">Loading ticket…</p>;

  const participants = [
    { name: t.fullName, delegateId: t.delegateId, qr: t.qr, memberIndex: 0 },
    ...(t.members || []).map((m, idx) => ({
      name: m.name,
      delegateId: m.delegateId,
      qr: m.qr,
      memberIndex: idx + 1
    }))
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className={`grid grid-cols-1 ${participants.length > 1 ? "md:grid-cols-2" : "max-w-md mx-auto"} gap-6`}>
        {participants.map((p) => {
          const hasPhoto = photoStatuses[p.memberIndex];

          return (
            <div key={p.memberIndex} className="overflow-hidden rounded-3xl border border-ink/10 bg-paper shadow-xl print:shadow-none flex flex-col justify-between">
              <div className="bg-midnight px-6 py-5 text-center text-cream">
                <p className="text-xs uppercase tracking-[0.3em] text-gold">Participant Pass</p>
                <p className="mt-1 font-display text-xl font-700">New Delhi Global Youth Summit</p>
                <p className="text-xs text-cream/60">22–23 August 2026 · IIT Delhi</p>
              </div>
              <div className="p-6 text-center flex-1 flex flex-col justify-between">
                <div>
                  {hasPhoto ? (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <img
                          src={`/api/registrations/${t.id}/photo?memberIndex=${p.memberIndex}&v=${version}`}
                          alt="Passport Photo"
                          className="h-32 w-28 object-cover rounded-xl border border-ink/15 shadow-sm bg-cream"
                        />
                        <img src={p.qr} alt="Check-in QR" className="h-32 w-32 border border-ink/5 p-1 rounded-xl bg-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <img src={p.qr} alt="Check-in QR" className="mx-auto h-56 w-56 border border-ink/5 p-2 rounded-2xl bg-white" />
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <p className="font-mono text-lg font-700 text-ink">{p.delegateId}</p>
                  <p className="mt-1 font-display text-lg text-ink">{p.name}</p>
                  <p className="text-sm text-slatey">{t.trackName}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 max-w-sm mx-auto flex flex-col gap-3">
        <button onClick={() => window.print()} className="w-full rounded-full bg-midnight py-3 font-600 text-cream hover:bg-royal">
          {participants.length > 1 ? "Print tickets" : "Print ticket"}
        </button>
        <a href="/api/delegate/badge" className="w-full rounded-full border border-ink/20 py-3 text-center font-600 text-ink hover:border-gold">
          {participants.length > 1 ? "Download pass badges (PDF)" : "Download pass badge (PDF)"}
        </a>
        <a href="/api/delegate/calendar" className="w-full rounded-full border border-ink/20 py-3 text-center font-600 text-ink hover:border-gold">Add to calendar (.ics)</a>
        <p className="mt-3 text-center text-xs text-slatey">This ticket works offline once you've opened it on this device.</p>
      </div>
    </div>
  );
}
