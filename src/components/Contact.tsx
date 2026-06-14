"use client";
import { useState } from "react";
import SectionKicker from "./SectionKicker";

type State = "idle" | "sending" | "ok" | "error";

export default function Contact() {
  const [state, setState] = useState<State>("idle");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setErrors({});
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setState("ok");
      form.reset();
    } else {
      const data = await res.json().catch(() => ({}));
      setErrors(data.issues || {});
      setState("error");
    }
  }

  return (
    <section id="contact" className="relative overflow-hidden bg-midnight py-28 text-cream">
      {/* background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-royal/30 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-gold/5 blur-3xl animate-pulse" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-2 relative z-10 items-center">
        <div>
          <SectionKicker label="COMMUNIQUÉ — 05" />
          <h2 className="mt-5 font-display text-4xl font-700 sm:text-6xl">
            LET'S <span className="text-shimmer inline-block">TALK.</span>
          </h2>
          <p className="mt-5 max-w-md text-cream/70 leading-relaxed">
            Reach the Summit team directly — for registrations, track questions or press enquiries. We are here to support you.
          </p>

          <div className="mt-10 space-y-4 max-w-sm">
            <a href="mailto:info@globalyouthsummit.com" className="flex items-center gap-4 rounded-2xl border border-[#D97706]/15 bg-[#D97706]/5 p-4 text-cream/80 transition-all duration-300 hover:border-gold/50 hover:bg-gold/10 hover:text-gold hover:translate-x-1 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold text-lg">✉</span>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-cream/40 font-semibold">Email Us</p>
                <p className="text-sm font-500">info@globalyouthsummit.com</p>
              </div>
            </a>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4 rounded-2xl border border-[#D97706]/15 bg-[#D97706]/5 p-4 text-cream/80">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold text-lg">☎</span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-cream/40 font-semibold">Call Us</p>
                  <p className="text-sm font-500">
                    <a href="tel:+918447676110" className="underline-offset-2 hover:underline">+91 84476 76106</a>
                    <span className="mx-2">·</span>
                    <a href="tel:+919311276303" className="underline-offset-2 hover:underline">+91 93112 76303</a>
                  </p>
                </div>
              </div>
              <a href="https://wa.me/918447676110" className="flex items-center gap-4 rounded-2xl border border-[#D97706]/15 bg-[#D97706]/5 p-4 text-cream/80 transition-all duration-300 hover:border-gold/50 hover:bg-gold/10 hover:text-gold hover:translate-x-1 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold text-lg">⦿</span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-cream/40 font-semibold">WhatsApp</p>
                  <p className="text-sm font-500">Chat with support <span className="mx-2">·</span> <a href="tel:+918447676110" className="underline-offset-2 hover:underline">+91 84476 76106</a></p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-[#D97706]/20 bg-midnight/60 p-8 text-cream backdrop-blur-md shadow-2xl">
          <Field name="fullName" label="Full Name" errors={errors} />
          <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <Field name="email" type="email" label="Email" errors={errors} />
          <Field name="phone" label="Phone Number (optional)" errors={errors} />
          <div>
            <label className="text-sm font-500 text-cream/80">Subject</label>
            <select name="subject" required className="focus-glow mt-1.5 w-full rounded-xl border border-[#D97706]/20 bg-midnight/50 px-4 py-3 text-cream outline-none transition-all duration-300">
              <option className="bg-midnight text-cream">General Enquiry</option>
              <option className="bg-midnight text-cream">Track Question</option>
              <option className="bg-midnight text-cream">Registration Help</option>
              <option className="bg-midnight text-cream">Press / Media</option>
              <option className="bg-midnight text-cream">Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-500 text-cream/80">Message</label>
            <textarea name="message" rows={4} required className="focus-glow mt-1.5 w-full rounded-xl border border-[#D97706]/20 bg-midnight/50 px-4 py-3 text-cream outline-none transition-all duration-300" />
            {errors.message && <p className="mt-1.5 text-xs text-red-400 font-500">{errors.message[0]}</p>}
          </div>

          <button
            disabled={state === "sending"}
            className="group relative overflow-hidden w-full rounded-full bg-gold py-3.5 font-600 text-midnight transition-all duration-300 hover:bg-goldlite disabled:opacity-60 shadow-lg shadow-gold/15"
          >
            <span className="relative z-10">{state === "sending" ? "Sending…" : "Send Message"}</span>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
          </button>

          {state === "ok" && <p className="text-sm font-600 text-goldlite animate-pulse mt-2">Thanks — we'll be in touch shortly.</p>}
          {state === "error" && Object.keys(errors).length === 0 && (
            <p className="text-sm text-red-400 font-500 mt-2">Something went wrong. Please try again.</p>
          )}
        </form>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  errors
}: {
  name: string;
  label: string;
  type?: string;
  errors: Record<string, string[]>;
}) {
  return (
    <div>
      <label className="text-sm font-500 text-cream/80">{label}</label>
      <input
        name={name}
        type={type}
        className="focus-glow mt-1.5 w-full rounded-xl border border-[#D97706]/20 bg-midnight/50 px-4 py-3 text-cream outline-none placeholder:text-cream/35 transition-all duration-300"
      />
      {errors[name] && <p className="mt-1.5 text-xs text-red-400 font-500">{errors[name][0]}</p>}
    </div>
  );
}
