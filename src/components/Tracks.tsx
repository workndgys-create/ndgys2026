import Link from "next/link";
import SectionKicker from "./SectionKicker";
import Reveal from "./Reveal";
import { getPublicTracks } from "@/lib/publicData";
import { getFlag } from "@/lib/settings";

const TRACK_IMAGES: Record<string, string> = {
  unsc: "/UNSC.jpeg",
  unga: "/UNGA.jpeg",
  unhrc: "/UNHRC.jpeg",
  csw: "/UNCSW.jpeg",
  unicef: "/UNICEF.jpeg",
  unep: "/UNEP.jpeg",
  wto: "/WTO.jpeg",
  "international-press": "/IP.jpeg",
  aippm: "/AIPPM.jpeg",
  "lok-sabha": "/LOKSABHA.jpeg",
  "war-cabinet": "/IWC.jpeg",
  ipl: "/IPL.jpeg",
};

export default async function Tracks() {
  const tracks = await getPublicTracks();
  const showPricing = await getFlag("home.showTrackPricing");
  return (
    <section id="tracks" className="bg-cream grain py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <SectionKicker label="DISPATCH — 02" />
          <h2 className="mt-5 font-display text-4xl font-700 text-ink sm:text-6xl">
            PICK YOUR <span className="text-gold">TRACK.</span>
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map((t, i) => {
            const imageSrc = TRACK_IMAGES[t.slug];
            return (
            <Reveal key={t.slug} delay={(i % 3) * 90}>
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative h-40 overflow-hidden bg-midnight">
                  {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageSrc} alt={t.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center font-display text-6xl font-900 text-white/5">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  )}
                  <div className="absolute right-4 top-3 rounded-full bg-black/30 px-3 py-1 text-[11px] font-500 text-cream backdrop-blur">
                    {t.full ? "Full" : `${t.seatsRemaining} left`}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-xl font-700 leading-tight text-ink">{t.name}</h3>
                  </div>
                  {showPricing && (
                    <p className="mt-1 text-sm font-700 text-[#92400E]">Rs {Number(t.fee).toLocaleString("en-IN")}</p>
                  )}
                  <span className="mt-1 text-[11px] uppercase tracking-wider text-slatey">{t.difficulty}</span>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/70">{t.agenda}</p>
                  <div className="mt-5 flex gap-2">
                    <Link href={`/committees/${t.slug}`} className="rounded-full border border-ink/15 px-4 py-2 text-sm font-500 text-ink hover:border-gold">
                      Details
                    </Link>
                    <Link
                      href={t.full ? `/committees/${t.slug}` : `/register?track=${t.slug}`}
                      className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2 text-sm font-600 text-cream transition group-hover:bg-gold group-hover:text-midnight"
                    >
                      {t.full ? "Join Waitlist" : "Register →"}
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
