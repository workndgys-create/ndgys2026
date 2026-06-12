"use client";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [data, setData] = useState<any>(null);
  const [state, setState] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => { fetch("/api/delegate/me").then(async (r) => r.ok && setData((await r.json()).registration)); }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setState("saving"); setErrors({});
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/delegate/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(fd.entries())) });
    if (r.ok) setState("ok"); else { setErrors((await r.json().catch(() => ({}))).issues || {}); setState("error"); }
  }

  if (!data) return <p className="text-slatey">Loading…</p>;
  const F = ({ name, label, def, type = "text" }: { name: string; label: string; def?: string; type?: string }) => (
    <div><label className="text-sm font-500 text-ink/80">{label}</label>
      <input name={name} type={type} defaultValue={def} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold" />
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name][0]}</p>}</div>
  );

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-700 text-ink">Profile</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-ink/10 bg-paper p-6">
        <div><label className="text-sm font-500 text-ink/80">Email (locked)</label>
          <input value={data.email} disabled className="mt-1 w-full rounded-lg border border-ink/10 bg-cream/60 px-3 py-2.5 text-slatey" /></div>
        <div><label className="text-sm font-500 text-ink/80">Full Name (locked)</label>
          <input value={data.fullName} disabled className="mt-1 w-full rounded-lg border border-ink/10 bg-cream/60 px-3 py-2.5 text-slatey" />
          <input type="hidden" name="fullName" value={data.fullName} /></div>
        <div><label className="text-sm font-500 text-ink/80">Phone (locked)</label>
          <input value={data.phone} disabled className="mt-1 w-full rounded-lg border border-ink/10 bg-cream/60 px-3 py-2.5 text-slatey" />
          <input type="hidden" name="phone" value={data.phone} /></div>
        <div><label className="text-sm font-500 text-ink/80">School / College (locked)</label>
          <input value={data.institution ?? ""} disabled className="mt-1 w-full rounded-lg border border-ink/10 bg-cream/60 px-3 py-2.5 text-slatey" />
          <input type="hidden" name="institution" value={data.institution ?? ""} /></div>
        <F name="dietary" label="Dietary requirements" def={data.dietary ?? ""} />
        <F name="accessibility" label="Accessibility needs" def={data.accessibility ?? ""} />
        <button disabled={state === "saving"} className="rounded-full bg-midnight px-6 py-2.5 font-600 text-cream hover:bg-royal disabled:opacity-60">{state === "saving" ? "Saving…" : "Save changes"}</button>
        {state === "ok" && <p className="text-sm text-green-700">Saved.</p>}
      </form>
    </div>
  );
}
