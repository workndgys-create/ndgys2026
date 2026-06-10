"use client";
import { useEffect, useState } from "react";

const TARGET = new Date("2026-08-22T09:00:00+05:30").getTime();

function getTimeLeft() {
  const diff = Math.max(0, TARGET - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function CountdownTimer() {
  const [mounted, setMounted] = useState(false);
  const [t, setT] = useState(getTimeLeft());

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setT(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { label: "DAYS", value: t.days },
    { label: "HOURS", value: t.hours },
    { label: "MINS", value: t.minutes },
    { label: "SECS", value: t.seconds },
  ];

  if (!mounted) {
    return (
      <div className="mt-12 flex w-full flex-wrap items-center justify-center gap-2 sm:gap-5 opacity-0 transition-opacity duration-300">
        {units.map((u, i) => (
          <div key={u.label} className="flex items-center gap-3 sm:gap-5">
            <div className="flex flex-col items-center">
              <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border border-gold/20 bg-midnight/45 backdrop-blur-md">
                <span className="font-display text-3xl sm:text-4xl font-900 text-cream/40 leading-none">00</span>
              </div>
              <span className="mt-2 text-[9px] sm:text-[10px] tracking-[0.25em] text-gold/50 font-semibold uppercase">
                {u.label}
              </span>
            </div>
            {i < units.length - 1 && (
              <span className="mb-5 text-2xl font-700 text-gold/30 leading-none select-none">:</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-12 flex w-full flex-wrap items-center justify-center gap-2 sm:gap-5 animate-fadeUp">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center gap-3 sm:gap-5">
          <div className="flex flex-col items-center">
            <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border border-[#D97706]/30 bg-[#3B1A0A]/70 backdrop-blur-md shadow-lg shadow-[#3B1A0A]/30">
              {/* subtle top shine */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] rounded-t-2xl bg-gradient-to-r from-transparent via-[#D97706]/50 to-transparent" />
              <span className="font-display text-3xl sm:text-4xl font-900 text-[#EFE5C8] tabular-nums leading-none drop-shadow-[0_2px_6px_rgba(217,119,6,0.3)]">
                {pad(u.value)}
              </span>
            </div>
            <span className="mt-2 text-[9px] sm:text-[10px] tracking-[0.25em] text-[#D97706] font-semibold uppercase">
              {u.label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span className="mb-5 text-2xl font-700 text-[#D97706]/60 leading-none select-none">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
