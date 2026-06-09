import SectionKicker from "./SectionKicker";
import Reveal from "./Reveal";

const guides = [
  { level: "Beginner", title: "Your First Summit", desc: "Never attended before? Preparation, what to expect, and how to speak with confidence." },
  { level: "Beginner", title: "Position Papers", desc: "Structure, template language and research method to write a paper that stands out." },
  { level: "Beginner", title: "Resolution Writing", desc: "Preambulatory and operative clauses, working papers and amendments — from scratch." },
  { level: "Advanced", title: "Rules of Procedure", desc: "The complete ROP handbook — points, motions and floor procedure across formats." },
  { level: "Advanced", title: "Crisis & Diplomacy", desc: "Directives, backroom strategy and how to drive a fast-moving crisis arc." }
];

export default function Resources() {
  return (
    <section id="resources" className="bg-paper py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <SectionKicker label="DISPATCH — 03" />
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-4xl font-700 text-ink sm:text-6xl">
              DELEGATE <span className="text-gold">GUIDES.</span>
            </h2>
            <div className="flex gap-6 text-sm text-slatey">
              <span><b className="text-ink">13+</b> Guides</span>
              <span><b className="text-ink">Free</b> Access</span>
              <span><b className="text-ink">All</b> Levels</span>
            </div>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((g, i) => (
            <Reveal key={g.title} delay={(i % 3) * 90}>
              <a href="#" className="group block h-full rounded-2xl border border-ink/10 bg-cream p-6 transition hover:border-gold hover:shadow-lg">
                <span className="kicker text-[10px] font-semibold text-gold">{g.level.toUpperCase()}</span>
                <h3 className="mt-2 font-display text-xl font-700 text-ink">{g.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{g.desc}</p>
                <span className="mt-4 inline-block text-sm font-600 text-midnight group-hover:text-gold">Read Guide →</span>
              </a>
            </Reveal>
          ))}
          <Reveal delay={180}>
            <a href="#" className="flex h-full flex-col justify-center rounded-2xl bg-midnight p-6 text-cream transition hover:bg-royal">
              <h3 className="font-display text-xl font-700 text-goldlite">More Guides</h3>
              <p className="mt-2 text-sm text-cream/70">Advanced ROP · International Press · Committee-specific briefs.</p>
              <span className="mt-4 text-sm font-600 text-gold">View All →</span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
