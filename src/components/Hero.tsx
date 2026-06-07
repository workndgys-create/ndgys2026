import Link from "next/link";
import CountdownTimer from "./CountdownTimer";
import Particles from "./Particles";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-midnight pt-32 pb-44 text-cream">
      {/* ── layered background ── */}
      <div className="pointer-events-none absolute inset-0">
        {/* animated canvas particles */}
        <Particles />
        {/* atmospheric glows */}
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-gold/10 blur-3xl animate-float" />
        <div className="absolute right-0 top-32 h-[28rem] w-[28rem] rounded-full bg-royal/40 blur-3xl" />
        <div className="absolute left-1/2 bottom-0 h-64 w-[60%] -translate-x-1/2 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute inset-0 grain opacity-30" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-5 text-center">
        {/* kicker */}
        <p className="kicker mb-6 text-[11px] font-semibold uppercase text-gold animate-fadeUp">
          We built the summit we wished existed
        </p>

        {/* headline */}
        <h1 className="headline font-display text-5xl font-900 sm:text-7xl md:text-8xl animate-fadeUp">
          NEW DELHI<br />
          <span className="text-goldlite">GLOBAL YOUTH</span><br />
          SUMMIT
        </h1>

        {/* date badge */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-gold/40 bg-white/5 px-6 py-2 text-sm tracking-[0.2em] backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
          22 – 23 AUGUST 2026 · NEW DELHI
        </div>

        {/* countdown */}
        <CountdownTimer />

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="rounded-full bg-gold px-8 py-3.5 font-600 text-midnight shadow-lg shadow-gold/20 transition hover:bg-goldlite hover:shadow-gold/30 hover:scale-105 active:scale-95"
          >
            Secure Your Spot
          </Link>
          <Link
            href="#tracks"
            className="rounded-full border border-cream/30 px-8 py-3.5 font-500 text-cream transition hover:border-gold hover:text-gold hover:bg-white/5"
          >
            Explore Program
          </Link>
        </div>
      </div>

      {/* skyline silhouette */}
      <svg
        className="absolute bottom-0 left-0 w-full text-ink"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0 120V70h60v-20h40v30h50V40h30v60h40V60h60v-30h30v90h50V50h40v70h60V30h30v90h60V70h50v50h40V50h60v70h50V40h30v80h60V60h50v60h40V70h60v50h40V40h30v80h60V60h50v60h140V120z"
        />
      </svg>
    </section>
  );
}
