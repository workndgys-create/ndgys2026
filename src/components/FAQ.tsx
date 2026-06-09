"use client";
import { useState } from "react";
import SectionKicker from "./SectionKicker";

const ALL = "All";
const faqs = [
  { cat: "About", q: "What is the New Delhi Global Youth Summit?", a: "It is a national-level youth diplomacy and leadership summit where students simulate global committees, debate policy, and build skills in research, public speaking and negotiation. 2026 is the inaugural edition." },
  { cat: "About", q: "When and where is it taking place?", a: "22–23 August 2026 at IIT Delhi, New Delhi." },
  { cat: "Registration", q: "Who can participate?", a: "Open to school and college students across India. There is a track suited to every level, from first-timers to seasoned delegates." },
  { cat: "Registration", q: "How do I register and pay?", a: "Click Register, choose your track, fill in your details and pay securely online. You'll receive an instant email confirmation once payment succeeds." },
  { cat: "Tracks", q: "Which committees are offered?", a: "We offer 11 committees: United Nations Security Council; United Nations General Assembly; United Nations Human Rights Council; United Nations Commission on the Status of Women; United Nations International Children's Emergency Fund (UNICEF); United Nations Environment Programme; World Trade Organization; All India Political Parties Meet; Lok Sabha; Indian War Cabinet; and the Indian Premier League." },
  { cat: "Tracks", q: "Can I change my track later?", a: "Yes — email the team before allotments are finalised and we'll do our best to accommodate the switch." },
  { cat: "General", q: "Is there a fee?", a: "Standard tracks are ₹2,500; flagship and crisis tracks are higher. The fee is shown on each track card before payment." }
];

export default function FAQ() {
  const cats = [ALL, ...Array.from(new Set(faqs.map((f) => f.cat)))];
  const [cat, setCat] = useState(ALL);
  const [open, setOpen] = useState<number | null>(0);
  const shown = faqs.filter((f) => cat === ALL || f.cat === cat);

  return (
    <section id="faq" className="bg-cream grain py-28">
      <div className="mx-auto max-w-3xl px-5">
        <SectionKicker label="DISPATCH — 04" />
        <h2 className="mt-5 font-display text-4xl font-700 text-ink sm:text-6xl">
          GOT <span className="text-gold">QUESTIONS?</span>
        </h2>
        <p className="mt-3 text-sm text-slatey">Have queries about participation, fees, or timeline? We've got you covered.</p>

        <div className="mt-8 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => { setCat(c); setOpen(null); }}
              className={`rounded-full border px-5 py-2 text-xs font-600 uppercase tracking-wider transition-all duration-300 ${
                cat === c
                  ? "border-gold bg-gold text-midnight shadow-md shadow-gold/25 scale-105"
                  : "border-ink/10 bg-paper text-ink/65 hover:border-gold hover:text-gold"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-10 space-y-4">
          {shown.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className={`overflow-hidden rounded-2xl border transition-all duration-400 ${
                  isOpen
                    ? "border-gold/30 bg-midnight text-cream shadow-xl shadow-black/15"
                    : "border-ink/10 bg-paper text-ink"
                }`}
              >
                <button
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className={`font-display text-lg font-600 transition-colors duration-300 ${isOpen ? "text-goldlite" : "text-ink"}`}>
                    {f.q}
                  </span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-lg font-500 transition-all duration-300 ${
                      isOpen ? "border-goldlite/30 bg-gold/10 text-goldlite rotate-45" : "border-ink/10 bg-cream text-gold"
                    }`}
                  >
                    +
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className={`px-6 pb-6 text-[15px] leading-relaxed transition-colors duration-300 ${isOpen ? "text-cream/75" : "text-ink/70"}`}>
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
