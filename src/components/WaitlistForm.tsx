"use client";
import { useState } from "react";

export default function WaitlistForm({ trackSlug }: { trackSlug: string }) {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: fd.get("fullName"), email: fd.get("email"), track: trackSlug })
    });
    setState(res.ok ? "ok" : "error");
  }
  if (state === "ok") return <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">You're on the waitlist — watch your inbox.</p>;
  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row">
      <input name="fullName" required placeholder="Full name" className="flex-1 rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-gold" />
      <input name="email" type="email" required placeholder="Email" className="flex-1 rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-gold" />
      <button disabled={state === "sending"} className="rounded-full bg-midnight px-6 py-2.5 text-sm font-600 text-cream hover:bg-royal disabled:opacity-60">
        {state === "sending" ? "…" : "Join"}
      </button>
    </form>
  );
}
