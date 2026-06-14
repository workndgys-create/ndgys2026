import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicTracks } from "@/lib/publicData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WaitlistForm from "@/components/WaitlistForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const t = (await getPublicTracks()).find((x) => x.slug === params.slug);
  if (!t) return { title: "Committee not found" };
  return { title: `${t.name} — NDGYS 4.0`, description: t.agenda };
}

export default async function CommitteeDetail({ params }: { params: { slug: string } }) {
  const tracks = await getPublicTracks();
  const t = tracks.find((x) => x.slug === params.slug);
  if (!t) notFound();

  const filledPct = t.capacity ? Math.min(100, Math.round(((t.capacity - t.seatsRemaining) / t.capacity) * 100)) : 0;

  return (
    <>
      <Navbar />
      <main className="bg-cream grain pt-36">
        <article className="mx-auto max-w-3xl px-5 pb-20">
          <Link href="/committees" className="text-sm text-gold hover:underline">← All committees</Link>
          <span className="ml-3 rounded-full bg-paper px-3 py-1 text-xs uppercase tracking-wider text-slatey">{t.difficulty}</span>

          <h1 className="mt-5 font-display text-5xl font-700 leading-tight text-ink sm:text-6xl">{t.name}</h1>

          <div className="mt-8 rounded-2xl border border-ink/10 bg-paper p-6">
            <h2 className="font-display text-lg font-700 text-ink">Agenda</h2>
            <p className="mt-2 text-ink/75">{t.agenda}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-1">
              <Stat label="Delegate fee" value={`₹${t.fee.toLocaleString("en-IN")}`} />
            </div>

              {String(t.name).trim().toLowerCase() === "international press" && (
                <div className="mt-6 rounded-2xl border border-ink/10 bg-cream p-4">
                  <h3 className="font-display text-lg font-700 text-ink">Portfolios</h3>
                  <ul className="mt-2 list-inside list-disc pl-4 text-ink/80">
                    <li>Journalist</li>
                    <li>Caricature</li>
                    <li>Photographer</li>
                  </ul>
                  
                </div>
              )}

            <div className="mt-5">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink/10">
                <div className="h-full rounded-full bg-gold" style={{ width: `${filledPct}%` }} />
              </div>
              <p className="mt-2 text-xs text-slatey">{filledPct}% filled</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-ink/10 bg-paper p-6">
            <h2 className="font-display text-lg font-700 text-ink">Description</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/80 whitespace-pre-line">{t.description || t.agenda}</p>
          </div>

          {!t.full ? (
            <Link href={`/register?track=${t.slug}`} className="mt-8 inline-block rounded-full bg-gold px-8 py-3.5 font-600 text-midnight transition hover:bg-goldlite">
              Register for this committee →
            </Link>
          ) : (
            <div className="mt-8 rounded-2xl border border-ink/10 bg-paper p-6">
              <h2 className="font-display text-xl font-700 text-ink">This committee is full</h2>
              <p className="mt-1 text-sm text-ink/70">Join the waitlist and we'll email you the moment a seat opens.</p>
              <WaitlistForm trackSlug={t.slug} />
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-cream px-4 py-3">
    <p className="text-xs uppercase tracking-wider text-slatey">{label}</p>
    <p className="mt-1 font-display text-2xl font-700 text-ink">{value}</p>
  </div>
);
