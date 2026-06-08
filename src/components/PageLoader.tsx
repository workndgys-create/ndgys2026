"use client";

import { useEffect, useState } from "react";

export default function PageLoader() {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [visible, setVisible] = useState(true);

<<<<<<< HEAD
  // ── Progress animation: 7 s easeInOutSine fill → 1.5 s hold → fade out ─────
  useEffect(() => {
    let raf = 0;
    const duration = 7000; // fill duration
    const holdAfter = 1500; // pause at 100% before fading

    function easeInOutSine(t: number) {
      return -(Math.cos(Math.PI * t) - 1) / 2;
    }

    const start = performance.now();

    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      setProgress(Math.round(easeInOutSine(t) * 100));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // hold at 100% for holdAfter ms, then fade
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => setVisible(false), 900);
        }, holdAfter);
=======
  // ── Progress animation (easeOutCubic, 3.5 s) ──────────────────────────────
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 3500;

    function easeOutCubic(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }

    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      setProgress(Math.round(easeOutCubic(t) * 100));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setFadeOut(true);
        setTimeout(() => setVisible(false), 600);
>>>>>>> 91a9070fd8e5905badb26d0e2aa576a0528ff5c9
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-cream grain px-4 py-8 select-none"
      style={{
        opacity: fadeOut ? 0 : 1,
<<<<<<< HEAD
        transition: "opacity 0.9s ease-in-out",
=======
        transition: "opacity 0.6s ease-out",
>>>>>>> 91a9070fd8e5905badb26d0e2aa576a0528ff5c9
        pointerEvents: fadeOut ? "none" : "auto",
      }}
    >
      <div className="flex flex-col items-center max-w-md w-full text-center space-y-6">

        {/* Kicker + Title */}
        <div className="space-y-2">
          <p className="font-body text-[10px] font-semibold text-gold tracking-widest uppercase">
            Preparing Summit Experience
          </p>
          <h1 className="font-display text-xl md:text-2xl text-ink font-bold tracking-tight">
            New Delhi Global Youth Summit 2026
          </h1>
        </div>

        {/* Image container — no border, no shadow, no bg, no padding */}
        <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[447/559] overflow-hidden">

          {/* Layer 1 — Grayscale base */}
          <div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/grayscale.svg')" }}
          />

          {/* Layer 2 — Progress fill: colored SVG revealed bottom → top */}
          <div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat pointer-events-none"
            style={{
              backgroundImage: "url('/colored-1.svg')",
              clipPath: `inset(0 0 ${100 - progress}% 0)`,
<<<<<<< HEAD
              transition: "clip-path 0.6s ease-in-out",
=======
              transition: "clip-path 0.3s ease-out",
>>>>>>> 91a9070fd8e5905badb26d0e2aa576a0528ff5c9
            }}
          />
        </div>

        {/* Progress counter + gold bar */}
        <div className="flex flex-col items-center space-y-2 w-full max-w-[200px]">
          <div className="flex justify-between w-full text-xs font-semibold text-slatey tracking-wider uppercase font-body">
            <span>Loading</span>
            <span>{progress}%</span>
          </div>
          <div className="h-[2px] w-full bg-gold/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full"
<<<<<<< HEAD
              style={{ width: `${progress}%`, transition: "width 0.6s ease-in-out" }}
=======
              style={{ width: `${progress}%`, transition: "width 0.3s ease-out" }}
>>>>>>> 91a9070fd8e5905badb26d0e2aa576a0528ff5c9
            />
          </div>
        </div>

      </div>
    </div>
  );
}
