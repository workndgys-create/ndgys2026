"use client";
import { useEffect, useState } from "react";
export default function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const cell = (v: number, l: string) => (
    <div className="text-center"><div className="font-display text-4xl font-900 text-goldlite">{String(v).padStart(2, "0")}</div><div className="text-[10px] uppercase tracking-widest text-cream/60">{l}</div></div>
  );
  return <div className="mt-3 flex gap-6">{cell(d, "Days")}{cell(h, "Hrs")}{cell(m, "Min")}{cell(s, "Sec")}</div>;
}
