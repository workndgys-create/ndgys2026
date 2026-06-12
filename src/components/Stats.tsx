"use client";
import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 2, suffix: "", label: "Days of Summit" },
  { value: 20, suffix: "+", label: "Competitions" },
  { value: 20, suffix: "+", label: "Speakers & Mentors" },
  { value: 5000, suffix: "+", label: "Expected Attendees" }
];

function useCountUp(target: number, run: boolean, ms = 1400) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / ms, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target, ms]);
  return n;
}

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setRun(true), io.disconnect()), {
      threshold: 0.3
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="stats" ref={ref} className="relative overflow-hidden bg-[#3B1A0A] py-24 text-cream">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-72 w-72 rounded-full bg-[#D97706]/[0.06] blur-3xl animate-pulse" />
      </div>

      <div className="mx-auto max-w-6xl px-5 relative z-10">
        <div className="rule-gold mb-12" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 text-center md:grid-cols-5">
          {stats.map((s) => (
            <Stat key={s.label} {...s} run={run} />
          ))}
        </div>
        <div className="rule-gold mt-12" />
      </div>
    </section>
  );
}

function Stat({ value, suffix, label, run }: { value: number; suffix: string; label: string; run: boolean }) {
  const n = useCountUp(value, run);
  return (
    <div className="transition-transform duration-500 hover:scale-105">
      <p className="font-display text-5xl font-900 text-[#F59E0B] inline-block md:text-6xl">
        {n}
        {suffix}
      </p>
      <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[#EFE5C8]/60 font-semibold">{label}</p>
    </div>
  );
}
