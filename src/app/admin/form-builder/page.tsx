"use client";
import { useEffect, useState } from "react";
import AdminShell, { Panel } from "@/components/admin/Shell";

type Q = { id: string; label: string; type: string; options: string | null; helpText: string | null; required: boolean; published: boolean; order: number };

const TYPE_LABELS: Record<string, string> = { short: "Short answer", paragraph: "Paragraph", select: "Multiple choice (pick one)", multiselect: "Checkboxes (pick many)" };
const isChoice = (t: string) => t === "select" || t === "multiselect";
function parseOptions(o: string | null): string[] { try { const v = JSON.parse(o || "[]"); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } }

export default function FormBuilderPage() {
  const [items, setItems] = useState<Q[] | null>(null);
  const [busy, setBusy] = useState(false);

  // new-question draft
  const [label, setLabel] = useState("");
  const [type, setType] = useState("short");
  const [optionsText, setOptionsText] = useState("");
  const [required, setRequired] = useState(false);

  function load() { fetch("/api/admin/registration-questions").then(async (r) => setItems(r.ok ? (await r.json()).items : [])); }
  useEffect(load, []);

  async function add() {
    if (!label.trim()) return;
    setBusy(true);
    const options = isChoice(type) ? optionsText.split("\n").map((s) => s.trim()).filter(Boolean) : [];
    const res = await fetch("/api/admin/registration-questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: label.trim(), type, options, required }) });
    setBusy(false);
    if (res.ok) { setLabel(""); setOptionsText(""); setType("short"); setRequired(false); load(); }
  }

  async function patch(id: string, body: any) { await fetch(`/api/admin/registration-questions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); load(); }
  async function remove(id: string) { if (!confirm("Delete this question?")) return; await fetch(`/api/admin/registration-questions/${id}`, { method: "DELETE" }); load(); }
  async function move(i: number, dir: -1 | 1) {
    if (!items) return;
    const j = i + dir; if (j < 0 || j >= items.length) return;
    const a = items[i], b = items[j];
    await Promise.all([
      fetch(`/api/admin/registration-questions/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: b.order }) }),
      fetch(`/api/admin/registration-questions/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: a.order }) })
    ]);
    load();
  }

  return (
    <AdminShell title="Registration form builder">
      <Panel title="Add a question">
        <p className="mb-4 text-sm text-slatey">Build your registration form like Google Forms. These questions appear on the delegate registration page; answers are saved with each registration and included in the CSV export.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-500 text-ink/80">Question</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. T-shirt size" className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5" />
          </div>
          <div>
            <label className="text-sm font-500 text-ink/80">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5">
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-ink/80">
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="accent-gold" /> Required
          </label>
          {isChoice(type) && (
            <div className="sm:col-span-2">
              <label className="text-sm font-500 text-ink/80">Options (one per line)</label>
              <textarea value={optionsText} onChange={(e) => setOptionsText(e.target.value)} rows={4} placeholder={"Option A\nOption B\nOption C"} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm" />
            </div>
          )}
          <div className="sm:col-span-2">
            <button onClick={add} disabled={busy || !label.trim()} className="rounded-full bg-gold px-6 py-2.5 font-600 text-midnight hover:bg-goldlite disabled:opacity-60">{busy ? "Adding…" : "Add question"}</button>
          </div>
        </div>
      </Panel>

      <Panel title="Your questions">
        {!items ? <p className="text-slatey">Loading…</p> : items.length === 0 ? <p className="py-6 text-center text-slatey">No custom questions yet. The form shows the standard fields only.</p> : (
          <div className="space-y-3">
            {items.map((q, i) => <QuestionCard key={q.id} q={q} first={i === 0} last={i === items.length - 1} onPatch={patch} onRemove={remove} onUp={() => move(i, -1)} onDown={() => move(i, 1)} />)}
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}

function QuestionCard({ q, first, last, onPatch, onRemove, onUp, onDown }: { q: Q; first: boolean; last: boolean; onPatch: (id: string, b: any) => void; onRemove: (id: string) => void; onUp: () => void; onDown: () => void }) {
  const [label, setLabel] = useState(q.label);
  const [type, setType] = useState(q.type);
  const [optionsText, setOptionsText] = useState(parseOptions(q.options).join("\n"));
  const dirty = label !== q.label || type !== q.type || optionsText !== parseOptions(q.options).join("\n");

  function save() {
    const options = isChoice(type) ? optionsText.split("\n").map((s) => s.trim()).filter(Boolean) : [];
    onPatch(q.id, { label, type, options });
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-paper p-4">
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-1 pt-1">
          <button onClick={onUp} disabled={first} className="text-ink/40 hover:text-ink disabled:opacity-30">▲</button>
          <button onClick={onDown} disabled={last} className="text-ink/40 hover:text-ink disabled:opacity-30">▼</button>
        </div>
        <div className="flex-1">
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 font-600 text-ink" />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-ink/15 bg-cream px-2 py-1.5 text-sm">
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-sm text-ink/70"><input type="checkbox" checked={q.required} onChange={(e) => onPatch(q.id, { required: e.target.checked })} className="accent-gold" /> Required</label>
            <label className="flex items-center gap-1.5 text-sm text-ink/70"><input type="checkbox" checked={q.published} onChange={(e) => onPatch(q.id, { published: e.target.checked })} className="accent-gold" /> Visible</label>
            {dirty && <button onClick={save} className="rounded-full bg-midnight px-4 py-1.5 text-sm font-600 text-cream hover:bg-royal">Save</button>}
            <button onClick={() => onRemove(q.id)} className="ml-auto text-sm font-600 text-red-600 hover:underline">Delete</button>
          </div>
          {isChoice(type) && (
            <textarea value={optionsText} onChange={(e) => setOptionsText(e.target.value)} rows={3} placeholder="One option per line" className="mt-2 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm" />
          )}
        </div>
      </div>
    </div>
  );
}
