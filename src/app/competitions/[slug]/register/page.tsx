import Link from "next/link";
import { getCompetitionBySlug } from "@/lib/publicData";
import CompetitionRegisterForm from "@/components/CompetitionRegisterForm";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { slug: string } }) {
  const c = await getCompetitionBySlug(params.slug);

  if (!c) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream grain px-5">
        <div className="text-center">
          <h1 className="font-display text-3xl font-700 text-ink">Competition not found</h1>
          <Link href="/#competitions" className="mt-4 inline-block text-gold hover:underline">← Back to competitions</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream grain px-5 py-16">
      <div className="mx-auto w-full max-w-lg">
        <Link href="/#competitions" className="text-sm text-gold hover:underline">← Back</Link>
        <p className="mt-3 text-xs uppercase tracking-wider text-slatey">{c.category}</p>
        <h1 className="font-display text-4xl font-700 text-ink">{c.title}</h1>
        <p className="mt-2 text-ink/70">{c.summary}</p>
        {!c.registrationOpen ? (
          <p className="mt-8 rounded-2xl border border-ink/10 bg-paper p-6 text-center text-ink/70">Registration for this competition is currently closed.</p>
        ) : (
          <CompetitionRegisterForm
            competition={{
              id: c.id, title: c.title, format: c.format as "SOLO" | "GROUP" | "BOTH",
              minTeam: c.minTeam, maxTeam: c.maxTeam, feeSolo: c.feeSolo, feeGroup: c.feeGroup,
              questions: (c.questionsText || "").split("\n").map((q: string) => q.trim()).filter(Boolean)
            }}
          />
        )}
      </div>
    </main>
  );
}
