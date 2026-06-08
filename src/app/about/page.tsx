import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About — New Delhi Global Youth Summit 4.0",
  description: "A two-day youth diplomacy summit bringing together students from across India and beyond to debate the issues that define our era."
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="bg-cream grain pt-28">
        <section className="mx-auto max-w-3xl px-5 pb-20">
          <p className="kicker text-xs uppercase text-gold">COMMUNIQUÉ — About</p>
          <h1 className="mt-4 font-display text-5xl font-700 leading-tight text-ink sm:text-7xl">
            Where the next generation <span className="text-gold">deliberates.</span>
          </h1>

          <div className="mt-8 space-y-5 text-lg leading-relaxed text-ink/80">
            <p>
              The New Delhi Global Youth Summit is a two-day gathering that brings together students and young
              professionals to step into the shoes of diplomats, journalists and founders. Across eight committees,
              delegates debate live agendas, draft resolutions and pitch ideas — learning by doing.
            </p>
            <p>
              Our inaugural edition runs on 22nd–23rd August 2026 at IIT Delhi. Every committee is chaired by experienced
              facilitators, and the programme balances rigorous debate with mentorship from practitioners in policy,
              climate, technology and enterprise.
            </p>
            <p>
              Whether it's your first conference or your fiftieth, the Summit is built to challenge you, widen your
              perspective and connect you with peers who care about the same questions you do.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[["22–23 Aug", "2026"], ["8", "Committees"], ["IIT Delhi", "New Delhi"]].map(([a, b]) => (
              <div key={b} className="rounded-2xl border border-ink/10 bg-paper p-5">
                <p className="font-display text-3xl font-700 text-ink">{a}</p>
                <p className="text-sm text-slatey">{b}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/committees" className="rounded-full bg-midnight px-6 py-3 font-600 text-cream hover:bg-royal">Explore committees</Link>
            <Link href="/register" className="rounded-full bg-gold px-6 py-3 font-600 text-midnight hover:bg-goldlite">Register</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
