import Link from "next/link";
import CountdownTimer from "./CountdownTimer";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#FFE8C8] min-h-[85vh] flex flex-col justify-between pt-44 pb-12 text-ink">
      
      {/* ── Background image layer ── */}
      <div 
        className="absolute inset-0 z-0 bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: "url('/ndgys home page bg.png')",
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
        }}
      />

      {/* ── Main content (centered in the sky area of the background) ── */}
      <div className="relative z-10 mx-auto max-w-5xl px-5 text-center my-auto">

        {/* Kicker */}
        <p className="kicker mb-4 text-xs font-bold uppercase text-[#B45309] animate-fadeUp tracking-[0.25em]">
          We built the summit we wished existed
        </p>

        {/* Bolder, Large Headline (sized nicely to fit the sky space) */}
        <h1 
          className="relative z-10 font-display font-black text-[#2A1005] leading-[0.95] tracking-tight animate-fadeUp drop-shadow-[0_4px_10px_rgba(42,16,5,0.12)]"
          style={{ fontSize: "clamp(2.8rem, 7.5vw, 5.2rem)" }}
        >
          NEW DELHI<br />
          <span className="text-[#D97706] font-black drop-shadow-[0_2px_6px_rgba(217,119,6,0.18)]">GLOBAL YOUTH</span><br />
          SUMMIT 4.0
        </h1>

<<<<<<< HEAD
        {/* Date badge */}
        <div className="mt-7 inline-flex items-center gap-3 rounded-full border-2 border-[#D97706]/40 bg-[#1F0A02] px-6 py-2.5 text-xs font-bold tracking-[0.18em] text-[#FFF8E7] shadow-xl shadow-[#1F0A02]/35 animate-fadeUp">
          <span className="h-2 w-2 rounded-full bg-[#F59E0B] animate-pulse" />
          22 – 23 AUGUST 2026 · NEW DELHI
=======
        {/* date badge */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-gold/30 bg-midnight/60 px-6 py-2.5 text-sm tracking-[0.2em] backdrop-blur-md shadow-inner shadow-white/5">
          <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
          22nd – 23rdAUGUST 2026 · NEW DELHI
>>>>>>> 0fc26ee70dc68df04a7e6fbd51553a00800abeed
        </div>

        {/* Countdown */}
        <div className="relative z-10 select-none scale-90 sm:scale-100">
          <CountdownTimer />
        </div>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fadeUp relative z-10">
          <Link
            href="/register"
            className="group relative overflow-hidden rounded-full bg-[#D97706] px-8 py-3.5 font-bold text-white shadow-lg shadow-[#D97706]/40 transition-all duration-300 hover:bg-[#B45309] hover:shadow-[#B45309]/50 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="relative z-10">Secure Your Spot</span>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] ease-out bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-12" />
          </Link>
          <Link
            href="#tracks"
            className="rounded-full border-2 border-[#2A1005]/65 bg-[#FFF8E7]/60 px-8 py-3.5 font-bold text-[#2A1005] backdrop-blur-sm transition-all duration-300 hover:border-[#D97706] hover:text-[#D97706] hover:bg-[#D97706]/10"
          >
            Explore Program
          </Link>
        </div>
      </div>

      {/* Spacer to push content up from the bottom monuments of the background image */}
      <div className="h-44 md:h-52 pointer-events-none" />

    </section>
  );
}
