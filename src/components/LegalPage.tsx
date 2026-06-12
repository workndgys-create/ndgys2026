import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="bg-cream grain pt-36">
        <article className="mx-auto max-w-3xl px-5 pb-20">
          <h1 className="font-display text-4xl font-700 text-ink sm:text-5xl">{title}</h1>
          <p className="mt-2 text-sm text-slatey">Last updated {updated}</p>
          <div className="mt-8 space-y-4 leading-relaxed text-ink/80 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-700 [&_h2]:text-ink">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
