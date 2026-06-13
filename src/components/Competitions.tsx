import { getPublicCompetitions } from "@/lib/publicData";
import Link from "next/link";
import SectionKicker from "./SectionKicker";
import Reveal from "./Reveal";
import { getFlag } from "@/lib/settings";

const COMPETITION_IMAGES: Record<string, string> = {
  "stock-sense": "/STOCKSENSE.jpeg",
  "spark-tank": "/SPARKTANK.jpeg",
  "greenovation-showdown": "/GREENOVATIONSHOWDOWN.jpeg",
  "film-making": "/FILMMAKING.jpeg",
  "ipl-auction": "/IPLAUCTION.jpeg",
  "marketing-mayhem": "/MARKETINGMAYHEM.jpeg",
  "sur-aur-taal": "/SURAURTAAL.jpeg",
  "nazarana": "/NAZARANA.jpeg",
  "beat-breakout": "/BEATBREAKOUT.jpeg",
  "battle-of-bands": "/BATTLEOFBANDS.jpeg",
  "shaame-mehfil": "/SHAAMEMEHFIL.png",
  "shaamemehfil": "/SHAAMEMEHFIL.png",
  "shaame-e-mehfil": "/SHAAMEMEHFIL.png",
};

/** Title-based fallback — catches any slug variant for known competitions */
function getImageByTitle(title: string): string | undefined {
  const t = title.toLowerCase();
  if (t.includes("shaame") || t.includes("mehfil")) return "/SHAAMEMEHFIL.png";
  if (t.includes("stock") && t.includes("sense")) return "/STOCKSENSE.jpeg";
  if (t.includes("spark") && t.includes("tank")) return "/SPARKTANK.jpeg";
  if (t.includes("greenovation")) return "/GREENOVATIONSHOWDOWN.jpeg";
  if (t.includes("film")) return "/FILMMAKING.jpeg";
  if (t.includes("ipl") && t.includes("auction")) return "/IPLAUCTION.jpeg";
  if (t.includes("marketing") && t.includes("mayhem")) return "/MARKETINGMAYHEM.jpeg";
  if (t.includes("sur") && t.includes("taal")) return "/SURAURTAAL.jpeg";
  if (t.includes("nazarana")) return "/NAZARANA.jpeg";
  if (t.includes("beat") && t.includes("breakout")) return "/BEATBREAKOUT.jpeg";
  if (t.includes("battle") && t.includes("band")) return "/BATTLEOFBANDS.jpeg";
  return undefined;
}

export default async function Competitions() {
  const items = await getPublicCompetitions();
  const showPricing = await getFlag("home.showCompetitionPricing");
  if (items.length === 0) return null;
  return (
    <section id="competitions" className="bg-paper py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <SectionKicker label="COMMUNIQUÉ — Competitions" />
          <h2 className="mt-5 text-center font-display text-4xl font-700 text-ink sm:text-left sm:text-6xl">COMPETE & <span className="text-gold">WIN.</span></h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c: any, i: number) => {
            const imageSrc = (c.imageUrl && String(c.imageUrl).trim()) || COMPETITION_IMAGES[c.slug] || getImageByTitle(c.title || "");
            return (
            <Reveal key={c.id} delay={(i % 3) * 90}>
              <>
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-cream shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                {imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageSrc} alt={c.title} className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-midnight font-display text-5xl font-900 text-white/10">{String(i + 1).padStart(2, "0")}</div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <span className="text-[11px] uppercase tracking-wider text-slatey">{c.category}</span>
                  <h3 className="mt-1 font-display text-xl font-700 text-ink">{c.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-ink/70">{(c.summary || "").replace(/🏆/g, "").replace(/\b(Rs\.?|₹)\s?\d[\d,]*/gi, "").replace(/trophy|certificate/gi, "").trim()}</p>
                  {showPricing && (
                    <p className="mt-2 text-sm font-700 text-[#92400E]">
                      {c.feeSolo && c.feeGroup
                        ? `Solo Rs ${Number(c.feeSolo).toLocaleString("en-IN")} / Group Rs ${Number(c.feeGroup).toLocaleString("en-IN")}`
                        : c.feeSolo
                          ? `Rs ${Number(c.feeSolo).toLocaleString("en-IN")}`
                          : c.feeGroup
                            ? `Group Rs ${Number(c.feeGroup).toLocaleString("en-IN")}`
                            : ""}
                    </p>
                  )}
                  <div className="mt-5 flex gap-2">
                    <Link href={`/competitions/${c.slug}`} className="rounded-full border border-ink/15 px-4 py-2 text-sm font-500 text-ink hover:border-gold">
                      Details
                    </Link>
                    {c.registrationOpen && (c.feeSolo || c.feeGroup) ? (
                      <Link
                        href={`/competitions/${c.slug}/register`}
                        className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2 text-sm font-600 text-cream transition group-hover:bg-gold group-hover:text-midnight"
                      >
                        Register →
                      </Link>
                    ) : c.ctaUrl ? (
                      <a
                        href={c.ctaUrl}
                        className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2 text-sm font-600 text-cream transition group-hover:bg-gold group-hover:text-midnight"
                      >
                        Learn more →
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
              {c.slug === "dispatch-02" && (
                <div className="mt-4 rounded-lg border border-ink/10 bg-white/50 p-4">
                  <h4 className="font-display text-lg font-700 text-ink">dispatch-02 — Pick your track</h4>
                  <p className="mt-2 text-sm text-ink/70">Choose one of the tracks below to participate. Click any track to learn more or register.</p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {items.map((t: any) => (
                      <li key={`track-${t.slug}`}>
                        <Link href={`/competitions/${t.slug}`} className="text-sm text-gold hover:underline">{t.title}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              </>
            </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
