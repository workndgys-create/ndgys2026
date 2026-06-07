"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell, { Panel } from "@/components/admin/Shell";

type Ann = { id: string; title: string; body: string; audience: string; trackSlug: string | null; publishedAt: string };

const TRACK_OPTS = [
  ["global-policy", "Global Policy Dialogue"], ["climate", "Climate & Sustainability Forum"],
  ["technology", "Technology & Society Lab"], ["entrepreneurship", "Youth Entrepreneurship Track"],
  ["human-rights", "Human Rights Council"], ["press", "International Press Corps"],
  ["leadership", "Leadership & Diplomacy Summit"], ["crisis", "Continuous Crisis Committee"]
] as const;

export default function AnnouncementsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Ann[] | null>(null);
  const [audience, setAudience] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function load() {
    fetch("/api/admin/announcements").then(async (r) => {
      if (r.status === 401) return router.push("/admin/login");
      setItems((await r.json()).announcements);
    });
  }
  useEffect(load, [router]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setErr("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(fd.entries()))
    });
    setSaving(false);
    if (res.ok) { (e.target as HTMLFormElement).reset(); setAudience("ALL"); load(); }
    else setErr((await res.json().catch(() => ({}))).error || "Could not publish.");
  }

  return (
    <AdminShell title="Announcements">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Panel title="New announcement">
          <form onSubmit={submit} className="space-y-3">
            <input name="title" required placeholder="Title" className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold" />
            <textarea name="body" required rows={5} placeholder="Message to delegates…" className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold" />
            <div className="grid grid-cols-2 gap-2">
              <select name="audience" value={audience} onChange={(e) => setAudience(e.target.value)} className="rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold">
                <option value="ALL">All delegates</option>
                <option value="PAID">Paid delegates</option>
                <option value="TRACK">Specific track</option>
              </select>
              {audience === "TRACK" && (
                <select name="trackSlug" required className="rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold">
                  {TRACK_OPTS.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
                </select>
              )}
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button disabled={saving} className="rounded-full bg-midnight px-5 py-2.5 text-sm font-600 text-cream hover:bg-royal disabled:opacity-60">{saving ? "Publishing…" : "Publish"}</button>
          </form>
        </Panel>

        <Panel title="Published">
          {!items ? (
            <p className="text-slatey">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-slatey">No announcements yet.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((a) => (
                <li key={a.id} className="border-b border-ink/5 pb-3 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-600 text-ink">{a.title}</p>
                    <span className="rounded-full bg-cream px-2 py-0.5 text-xs text-slatey">{a.audience}{a.trackSlug ? `: ${a.trackSlug}` : ""}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink/80">{a.body}</p>
                  <time className="text-xs text-slatey">{new Date(a.publishedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</time>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </AdminShell>
  );
}
