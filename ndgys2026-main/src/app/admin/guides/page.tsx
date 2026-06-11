"use client";
import { useEffect, useRef, useState } from "react";
import AdminShell, { Panel } from "@/components/admin/Shell";

// load tracks from public API
type Guide = { id: string; trackSlug: string; title: string; fileName: string; sizeBytes: number; uploadedAt: string };
function kb(n: number) { return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`; }

export default function Page() {
  const [items, setItems] = useState<Guide[] | null>(null);
  const [tracks, setTracks] = useState<{ value: string; label: string }[]>([]);
  const [trackSlug, setTrackSlug] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function load() { fetch("/api/admin/guides").then(async (r) => setItems(r.ok ? (await r.json()).items : [])); }
  useEffect(load, []);
  useEffect(() => {
    void (async () => {
      try {
        const [rTracks, rComps] = await Promise.all([
          fetch("/api/public/tracks"),
          fetch("/api/admin/competitions")
        ]);
        let unified: { value: string; label: string }[] = [];
        if (rTracks.ok) {
          const t = await rTracks.json();
          unified = unified.concat(t.map((x: any) => ({ value: x.value, label: `${x.label} (MUN)` })));
        }
        if (rComps.ok) {
          const c = await rComps.json();
          unified = unified.concat((c.items || []).map((x: any) => ({ value: x.slug, label: `${x.title} (Competition)` })));
        }
        setTracks(unified);
        if (unified.length) setTrackSlug(unified[0].value);
      } catch (_) { }
    })();
  }, []);

  async function upload(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    const file = fileRef.current?.files?.[0];
    if (!file || !title.trim()) { setMsg("Pick a committee or competition, enter a title and choose a PDF."); return; }
    setBusy(true);
    const fd = new FormData();
    fd.append("trackSlug", trackSlug); fd.append("title", title.trim()); fd.append("file", file);
    const res = await fetch("/api/admin/guides", { method: "POST", body: fd });
    setBusy(false);
    if (res.ok) { setTitle(""); if (fileRef.current) fileRef.current.value = ""; setMsg("Uploaded — delegates/participants of that committee/competition can now download it."); load(); }
    else setMsg((await res.json().catch(() => ({}))).error || "Upload failed (check your permissions / file size).");
  }

  async function remove(id: string) {
    if (!confirm("Delete this rules & regulations PDF?")) return;
    await fetch(`/api/admin/guides/${id}`, { method: "DELETE" }); load();
  }

  return (
    <AdminShell title="Rules & Regulations">
      <Panel title="Upload Rules & Regulations PDF">
        <form onSubmit={upload} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-500 text-ink/80">Committee / Competition</label>
            <select value={trackSlug} onChange={(e) => setTrackSlug(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5">
              {tracks.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-500 text-ink/80">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Rules & Regulations v1" className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-500 text-ink/80">PDF file (max 15MB)</label>
            <input ref={fileRef} type="file" accept="application/pdf" className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button disabled={busy} className="rounded-full bg-gold px-6 py-2.5 font-600 text-midnight hover:bg-goldlite disabled:opacity-60">{busy ? "Uploading…" : "Upload Rules & Regulations"}</button>
            {msg && <p className="text-sm text-ink/70">{msg}</p>}
          </div>
        </form>
      </Panel>

      <Panel title="Published Rules & Regulations">
        {!items ? <p className="text-slatey">Loading…</p> : items.length === 0 ? <p className="py-6 text-center text-slatey">No rules & regulations uploaded yet.</p> : (
          <div className="space-y-2">
            {items.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-xl border border-ink/10 bg-paper p-4">
                <div>
                  <p className="font-600 text-ink">{g.title}</p>
                  <p className="text-xs text-slatey">{tracks.find((t) => t.value === g.trackSlug)?.label} · {g.fileName} · {kb(g.sizeBytes)}</p>
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
