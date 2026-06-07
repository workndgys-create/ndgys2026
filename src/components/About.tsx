import SectionKicker from "./SectionKicker";
import Reveal from "./Reveal";

const details = [
  { label: "DATES", value: "Aug 22–23, 2026", sub: "Two intensive days" },
  { label: "VENUE", value: "IIT Delhi", sub: "New Delhi" },
  { label: "DELEGATE FEE", value: "₹2,500", sub: "Flagship tracks from ₹3,000" }
];

export default function About() {
  return (
    <section id="about" className="relative bg-cream grain py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <SectionKicker label="COMMUNIQUÉ — 01" />
          <h2 className="mt-5 font-display text-4xl font-700 text-ink sm:text-6xl">
            ABOUT THE <span className="text-gold">SUMMIT.</span>
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-12 md:grid-cols-2">
          <Reveal>
            <blockquote className="border-l-2 border-gold pl-6 font-display text-2xl leading-snug text-royal">
              “New Delhi's inaugural global youth gathering — built by young leaders, for young leaders.”
            </blockquote>
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
              <div className="h-full rounded-2xl border border-ink/10 bg-paper p-7 shadow-sm">
                <p className="kicker text-[10px] font-semibold text-slatey">{d.label}</p>
                <p className="mt-3 font-display text-3xl font-700 text-ink">{d.value}</p>
                <p className="mt-1 text-sm text-slatey">{d.sub}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={150}>
          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl bg-midnight p-7 text-cream sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-xl font-600 text-goldlite">Stay Updated — Join our WhatsApp Channel</p>
              <p className="mt-1 text-sm text-cream/70">Get schedule drops, track reveals and delegate guides directly.</p>
            </div>
            <a
              href="https://wa.me/919650058469"
              className="whitespace-nowrap rounded-full bg-gold px-6 py-3 font-600 text-midnight transition hover:bg-goldlite"
            >
              Join Channel →
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
