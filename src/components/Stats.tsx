"use client";
import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 2, suffix: "", label: "Days of Summit" },
  { value: 8, suffix: "", label: "Tracks" },
  { value: 40, suffix: "+", label: "Speakers & Mentors" },
  { value: 500, suffix: "+", label: "Expected Delegates" },
  { value: 1, suffix: "", label: "Inaugural Edition" }
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
    <section id="stats" ref={ref} className="bg-ink py-20 text-cream">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-12 px-5 text-center md:grid-cols-5">
        {stats.map((s) => (
          <Stat key={s.label} {...s} run={run} />
        ))}
      </div>
    </section>
  );
}

function Stat({ value, suffix, label, run }: { value: number; suffix: string; label: string; run: boolean }) {
  const n = useCountUp(value, run);
  return (
    <div>
      <p className="font-display text-5xl font-900 text-goldlite md:text-6xl">
        {n}
        {suffix}
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-cream/60">{label}</p>
    </div>
  );
}
