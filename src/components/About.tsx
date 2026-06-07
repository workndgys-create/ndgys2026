import SectionKicker from "./SectionKicker";
import Reveal from "./Reveal";

const details = [
  { label: "DATES", value: "Aug 22–23, 2026", sub: "Two intensive days" },
  { label: "VENUE", value: "IIT Delhi", sub: "New Delhi" },
  { label: "DELEGATE FEE", value: "₹2,500", sub: "Flagship tracks from ₹3,000" }
];

export default function About() {
  return (
    <section id="about" className="relative overflow-hidden bg-cream grain py-28">
      {/* Decorative concentric rings */}
      <div className="pointer-events-none absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 opacity-30">
        <svg width="400" height="400" viewBox="0 0 400 400" fill="none" className="text-gold/25">
          <circle cx="200" cy="200" r="190" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="200" cy="200" r="150" stroke="currentColor" strokeWidth="1" />
          <circle cx="200" cy="200" r="110" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="200" cy="200" r="70" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      <div className="mx-auto max-w-6xl px-5 relative z-10">
        <Reveal>
          <SectionKicker label="COMMUNIQUÉ — 01" />
          <h2 className="mt-5 font-display text-4xl font-700 text-ink sm:text-6xl">
            ABOUT THE <span className="text-gold">SUMMIT.</span>
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-12 md:grid-cols-2">
          <Reveal>
            <div className="relative pl-6">
              {/* Premium Vertical gold gradient border */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-gold via-goldlite to-transparent rounded-full" />
              <blockquote className="font-display text-2xl leading-snug text-royal italic">
                “New Delhi's inaugural global youth gathering — built by young leaders, for young leaders.”
              </blockquote>
            </div>
          </Reveal>

          <Reveal delay={120} className="space-y-5 text-[15px] leading-relaxed text-ink/80">
            <p>
              The New Delhi Global Youth Summit 2026 is a youth leadership and diplomacy
              conference convened in the heart of the capital — designed from the ground up by a
              team with deep experience across India's most competitive debate and policy circuits.
            </p>
            <p>
              Whether you are stepping into your first committee room or arriving as a seasoned
              delegate hungry for a rigorous challenge on live global agendas, the Summit is built
              for you. Two high-intensity days. Eight meticulously crafted tracks. A landmark
              inaugural edition — and a founding cohort who will always have been there first.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-3">
          {details.map((d, i) => (
            <Reveal key={d.label} delay={i * 100}>
              <div className="h-full rounded-2xl border border-ink/10 bg-paper p-7 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md hover:border-gold/30">
                <p className="kicker text-[10px] font-semibold text-slatey">{d.label}</p>
                <p className="mt-3 font-display text-3xl font-700 text-ink">{d.value}</p>
                <p className="mt-1 text-sm text-slatey">{d.sub}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={150}>
          <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-br from-midnight to-ink p-8 text-cream sm:flex-row sm:items-center border border-gold/15 relative overflow-hidden shadow-xl shadow-black/15">
            {/* subtle ambient background glow */}
            <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-gold/5 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center gap-4">
              <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/10 text-gold border border-gold/20">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                </svg>
              </div>
              <div>
                <p className="font-display text-xl font-600 text-goldlite">Stay Updated — Join our WhatsApp Channel</p>
                <p className="mt-1 text-sm text-cream/70">Get schedule drops, track reveals and delegate guides directly.</p>
              </div>
            </div>
            <a
              href="https://wa.me/919650058469"
              className="group relative z-10 overflow-hidden whitespace-nowrap rounded-full bg-gold px-7 py-3 font-600 text-midnight transition hover:bg-goldlite w-full sm:w-auto text-center shadow-lg shadow-gold/15"
            >
              Join Channel →
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
