"use client";
import { useEffect, useRef, useState } from "react";
import AdminShell, { Panel } from "@/components/admin/Shell";

const TRACK_OPTIONS = [
  { value: "global-policy", label: "Global Policy Dialogue" }, { value: "climate", label: "Climate & Sustainability Forum" },
  { value: "technology", label: "Technology & Society Lab" }, { value: "entrepreneurship", label: "Youth Entrepreneurship Track" },
  { value: "human-rights", label: "Human Rights Council" }, { value: "press", label: "International Press Corps" },
  { value: "leadership", label: "Leadership & Diplomacy Summit" }, { value: "crisis", label: "Continuous Crisis Committee" }
];
type Guide = { id: string; trackSlug: string; title: string; fileName: string; sizeBytes: number; uploadedAt: string };
function kb(n: number) { return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`; }

export default function Page() {
  const [items, setItems] = useState<Guide[] | null>(null);
  const [trackSlug, setTrackSlug] = useState(TRACK_OPTIONS[0].value);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function load() { fetch("/api/admin/guides").then(async (r) => setItems(r.ok ? (await r.json()).items : [])); }
  useEffect(load, []);

  async function upload(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    const file = fileRef.current?.files?.[0];
    if (!file || !title.trim()) { setMsg("Pick a committee, enter a title and choose a PDF."); return; }
    setBusy(true);
    const fd = new FormData();
    fd.append("trackSlug", trackSlug); fd.append("title", title.trim()); fd.append("file", file);
    const res = await fetch("/api/admin/guides", { method: "POST", body: fd });
    setBusy(false);
    if (res.ok) { setTitle(""); if (fileRef.current) fileRef.current.value = ""; setMsg("Uploaded — delegates of that committee can now download it."); load(); }
    else setMsg((await res.json().catch(() => ({}))).error || "Upload failed (check your permissions / file size).");
  }

  async function remove(id: string) {
    if (!confirm("Delete this guide?")) return;
    await fetch(`/api/admin/guides/${id}`, { method: "DELETE" }); load();
  }

  return (
    <AdminShell title="Study guides">
      <Panel title="Upload a background guide">
        <form onSubmit={upload} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-500 text-ink/80">Committee</label>
            <select value={trackSlug} onChange={(e) => setTrackSlug(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5">
              {TRACK_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-500 text-ink/80">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Background Guide v1" className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-500 text-ink/80">PDF file (max 15MB)</label>
            <input ref={fileRef} type="file" accept="application/pdf" className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button disabled={busy} className="rounded-full bg-gold px-6 py-2.5 font-600 text-midnight hover:bg-goldlite disabled:opacity-60">{busy ? "Uploading…" : "Upload guide"}</button>
            {msg && <p className="text-sm text-ink/70">{msg}</p>}
          </div>
        </form>
      </Panel>

      <Panel title="Published guides">
        {!items ? <p className="text-slatey">Loading…</p> : items.length === 0 ? <p className="py-6 text-center text-slatey">No guides uploaded yet.</p> : (
          <div className="space-y-2">
            {items.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-xl border border-ink/10 bg-paper p-4">
                <div>
                  <p className="font-600 text-ink">{g.title}</p>
                  <p className="text-xs text-slatey">{TRACK_OPTIONS.find((t) => t.value === g.trackSlug)?.label} · {g.fileName} · {kb(g.sizeBytes)}</p>
                </div>
                <button onClick={() => remove(g.id)} className="text-sm font-600 text-red-600 hover:underline">Delete</button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
