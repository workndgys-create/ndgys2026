"use client";

import { useEffect, useRef, useState } from "react";

export default function LoaderUI() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

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
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Flashlight / pointer tracking ─────────────────────────────────────────
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    el.style.setProperty("--mouse-x", "-999px");
    el.style.setProperty("--mouse-y", "-999px");
    el.style.setProperty("--mask-opacity", "0");

    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
      el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
      el.style.setProperty("--mask-opacity", "1");
    };

    const onPointerLeave = () => {
      el.style.setProperty("--mask-opacity", "0");
    };

    el.addEventListener("pointermove", onPointerMove, { passive: true });
    el.addEventListener("pointerleave", onPointerLeave);
    return () => {
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream grain px-4 py-8 select-none">
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
        <div
          ref={wrapperRef}
          className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[447/559] overflow-hidden cursor-crosshair"
          style={{ touchAction: "none" }}
        >
          {/* Layer 1 — Grayscale base */}
          <div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/grayscale.svg')" }}
          />

          {/* Layer 2 — Flashlight: colored SVG revealed around cursor */}
          <div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat pointer-events-none"
            style={{
              backgroundImage: "url('/colored-1.svg')",
              opacity: "var(--mask-opacity, 0)",
              transition: "opacity 0.2s ease",
              maskImage:
                "radial-gradient(circle 90px at var(--mouse-x, -999px) var(--mouse-y, -999px), black 0%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(circle 90px at var(--mouse-x, -999px) var(--mouse-y, -999px), black 0%, transparent 100%)",
            }}
          />

          {/* Layer 3 — Progress fill: colored SVG revealed bottom → top */}
          <div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat pointer-events-none"
            style={{
              backgroundImage: "url('/colored-1.svg')",
              clipPath: `inset(0 0 ${100 - progress}% 0)`,
              transition: "clip-path 0.3s ease-out",
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
              style={{ width: `${progress}%`, transition: "width 0.3s ease-out" }}
            />
          </div>
        </div>

        {/* Tip */}
        <p className="font-body text-[10px] tracking-wide text-slatey/70 animate-pulse">
          Move cursor or swipe screen to paint color
        </p>

      </div>
    </div>
  );
}
