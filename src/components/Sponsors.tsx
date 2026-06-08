import { getPublicSponsors } from "@/lib/publicData";
import { getSetting } from "@/lib/settings";
import SectionKicker from "./SectionKicker";
import Reveal from "./Reveal";

export default async function Sponsors() {
  const [items, grievanceEmail] = await Promise.all([getPublicSponsors(), getSetting("safety.grievanceEmail")]);
  // Always render the section so the "partner with us" CTA is visible even before sponsors are added.
  const partnerMail = `mailto:partnerships@nesummit.in?subject=Partnership%20enquiry%20%E2%80%94%20NDGYS%202026`;
  return (
    <section id="sponsors" className="bg-paper py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <SectionKicker label="DISPATCH — Partners" />
          <h2 className="mt-5 font-display text-4xl font-700 text-ink sm:text-6xl">IN GOOD <span className="text-gold">COMPANY.</span></h2>
        </Reveal>

        {items.length > 0 ? (
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((sp: any, i: number) => {
              const inner = sp.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sp.logoUrl} alt={sp.name} className="max-h-16 max-w-[80%] object-contain opacity-80 transition group-hover:opacity-100" />
              ) : (
                <span className="font-display text-xl font-700 text-ink/70">{sp.name}</span>
              );
              return (
                <Reveal key={sp.id} delay={(i % 4) * 70}>
                  <div className="group flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-cream p-4">
                    {sp.websiteUrl ? <a href={sp.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center">{inner}</a> : inner}
                    {sp.tier && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-600 uppercase tracking-wide text-ink/70">{sp.tier}</span>}
                  </div>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <p className="mt-8 text-ink/65">Partner announcements coming soon.</p>
        )}

        <div className="mt-12 flex flex-col items-center gap-3 rounded-2xl border border-gold/30 bg-goldlite/10 p-8 text-center">
          <h3 className="font-display text-2xl font-700 text-ink">Partner with the Summit</h3>
          <p className="max-w-xl text-ink/70">Reach hundreds of young leaders, schools and educators. We offer title, track and community partnerships with tailored visibility.</p>
          <a href={partnerMail} className="mt-2 rounded-full bg-gold px-6 py-3 font-600 text-midnight hover:bg-goldlite">Partner with us →</a>
        </div>
      </div>
    </section>
  );
}
