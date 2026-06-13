import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCompetitionBySlug } from "@/lib/publicData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = await getCompetitionBySlug(params.slug);
  if (!c) return { title: "Competition not found" };
  return { title: `${c.title} — NDGYS 4.0`, description: c.summary };
}

export default async function CompetitionDetail({ params }: { params: { slug: string } }) {
  const c = await getCompetitionBySlug(params.slug);
  if (!c) notFound();

  const formattedFormat = c.format === "BOTH" ? "Solo & Group" : c.format === "GROUP" ? "Group only" : "Solo only";

  const perks = [
    { title: "Trophies for All Winners", desc: "Take home stunning champion trophies to concrete your victory." },
    { title: "Exclusive Merchandise (20% Off)", desc: "Access limited-edition summit gear at a rare, participant-only discount." },
    { title: "Premium Delegate Kit", desc: "Receive a curated, high-value toolkit reserved strictly for attending delegates." },
    { title: "Certificate of Merit", desc: "Earn a prestigious, high-tier credential that sets your resume apart globally." },
    { title: "Memorable Socials", desc: "Build lifelong connections and network with the brightest young minds at exclusive events." },
    { title: "Highly Experienced Judges", desc: "Get your ideas evaluated and mentored by industry titans and global experts." },
    { title: "Gourmet Food & Beverages", desc: "Stay fueled with premium meals and refreshments provided throughout the entire summit." },
    { title: "Certificate of Participation", desc: "Secure official, globally recognized proof of your presence at this elite conference." },
  ];

  return (
    <>
      <Navbar />
      <main className="bg-cream grain pt-36">
        <article className="mx-auto max-w-3xl px-5 pb-20">
          <Link href="/#competitions" className="text-sm text-gold hover:underline">← All competitions</Link>
          <span className="ml-3 rounded-full bg-paper px-3 py-1 text-xs uppercase tracking-wider text-slatey">{c.category}</span>

          <h1 className="mt-5 font-display text-5xl font-700 leading-tight text-ink sm:text-6xl">{c.title}</h1>
          <p className="mt-4 text-lg text-ink/75 italic">{c.summary}</p>

          <div className="mt-8 rounded-2xl border border-ink/10 bg-paper p-6">
            <h2 className="font-display text-lg font-700 text-ink">Competition Details</h2>
            
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat 
                label="Registration fee" 
                value={
                  c.feeSolo && c.feeGroup 
                    ? `Solo: ₹${c.feeSolo.toLocaleString("en-IN")}\nGroup: ₹${c.feeGroup.toLocaleString("en-IN")}`
                    : c.feeSolo 
                      ? `₹${c.feeSolo.toLocaleString("en-IN")}` 
                      : c.feeGroup 
                        ? `Group: ₹${c.feeGroup.toLocaleString("en-IN")}` 
                        : "Free"
                } 
                isMultiline={!!(c.feeSolo && c.feeGroup)}
              />
              <Stat label="Prize Pool" value={c.prize || "Exciting Prizes"} />
              <Stat label="Format" value={formattedFormat} />
              <Stat 
                label="Team size" 
                value={
                  c.format === "SOLO" 
                    ? "1 Participant" 
                    : c.minTeam === c.maxTeam 
                      ? `${c.minTeam} Delegates`
                      : `${c.minTeam}-${c.maxTeam} Delegates`
                } 
              />
            </div>
          </div>

          {/* PERKS SECTION (Comes first, only for competitions) */}
          <div className="mt-8 rounded-2xl border border-ink/10 bg-paper p-6">
            <h2 className="font-display text-2xl font-700 text-ink flex items-center gap-2">
              <span className="text-gold">★</span> Perks & Inclusions
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {perks.map((p, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/10 text-xs text-gold font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-display font-600 text-sm text-ink">{p.title}</h3>
                    <p className="mt-1 text-xs text-ink/75 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-dashed border-gold/40 bg-gold/5 p-4 text-xs font-500 text-[#92400E] flex gap-2 items-center">
              <span className="text-sm">⚠</span>
              <span>Note: Seats are strictly limited. Secure your spot now before the opportunity passes.</span>
            </div>
          </div>

          {/* DESCRIPTION SECTION (Comes second) */}
          <div className="mt-8 rounded-2xl border border-ink/10 bg-paper p-6">
            <h2 className="font-display text-2xl font-700 text-ink">Description</h2>
            <div className="mt-4 text-ink/80 leading-relaxed whitespace-pre-line text-sm sm:text-base">
              {c.description || c.summary}
            </div>
          </div>

          {c.registrationOpen ? (
            <Link href={`/competitions/${c.slug}/register`} className="mt-8 inline-block rounded-full bg-gold px-8 py-3.5 font-600 text-midnight transition hover:bg-goldlite">
              Register for this competition →
            </Link>
          ) : (
            <div className="mt-8 rounded-2xl border border-ink/10 bg-paper p-6">
              <h2 className="font-display text-xl font-700 text-ink">Registration is closed</h2>
              <p className="mt-1 text-sm text-ink/70">Registration for this competition has reached capacity or is currently closed.</p>
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}

const Stat = ({ label, value, isMultiline = false }: { label: string; value: string; isMultiline?: boolean }) => (
  <div className="rounded-xl bg-cream px-4 py-3 h-full flex flex-col justify-between">
    <p className="text-[11px] uppercase tracking-wider text-slatey mb-1">{label}</p>
    <p className={`font-display text-lg font-700 text-ink leading-snug ${isMultiline ? "whitespace-pre-line text-sm" : ""}`}>{value}</p>
  </div>
);
