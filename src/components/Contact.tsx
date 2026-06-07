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
    <section id="contact" className="bg-midnight py-24 text-cream">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-2">
        <div>
          <SectionKicker label="COMMUNIQUÉ — 05" />
          <h2 className="mt-5 font-display text-4xl font-700 sm:text-6xl">
            LET'S <span className="text-goldlite">TALK.</span>
          </h2>
          <p className="mt-5 max-w-md text-cream/70">
            Reach the Summit team directly — for registrations, track questions or press enquiries.
          </p>
          <div className="mt-8 space-y-3">
            <a href="mailto:hi@nesummit.in" className="flex items-center gap-3 text-cream/85 hover:text-gold">
              ✉ <span>hi@nesummit.in</span>
            </a>
            <a href="tel:+919650058469" className="flex items-center gap-3 text-cream/85 hover:text-gold">
              ☎ <span>+91 96500 58469</span>
            </a>
            <a href="https://wa.me/919650058469" className="flex items-center gap-3 text-cream/85 hover:text-gold">
              ⦿ <span>WhatsApp us</span>
            </a>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-paper p-7 text-ink">
          <Field name="fullName" label="Full Name" errors={errors} />
          <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <Field name="email" type="email" label="Email" errors={errors} />
          <Field name="phone" label="Phone Number (optional)" errors={errors} />
          <div>
            <label className="text-sm font-500 text-ink/80">Subject</label>
            <select name="subject" required className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold">
              <option>General Enquiry</option>
              <option>Track Question</option>
              <option>Registration Help</option>
              <option>Press / Media</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-500 text-ink/80">Message</label>
            <textarea name="message" rows={4} required className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold" />
            {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message[0]}</p>}
          </div>

          <button
            disabled={state === "sending"}
            className="w-full rounded-full bg-gold py-3 font-600 text-midnight transition hover:bg-goldlite disabled:opacity-60"
          >
            {state === "sending" ? "Sending…" : "Send Message"}
          </button>

          {state === "ok" && <p className="text-sm font-600 text-green-700">Thanks — we'll be in touch shortly.</p>}
          {state === "error" && Object.keys(errors).length === 0 && (
            <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
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
      <label className="text-sm font-500 text-ink/80">{label}</label>
      <input
        name={name}
        type={type}
        className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold"
      />
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name][0]}</p>}
    </div>
  );
}
