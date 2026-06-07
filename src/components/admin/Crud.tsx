"use client";
import { useEffect, useState } from "react";
import { Panel } from "./Shell";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "url" | "datetime-local" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
};
export type Column = { key: string; label: string; render?: (row: any) => React.ReactNode };

export default function CrudManager({
  endpoint,
  fields,
  columns,
  hasPublished = true,
  newLabel = "New"
}: {
  endpoint: string;
  fields: Field[];
  columns: Column[];
  hasPublished?: boolean;
  newLabel?: string;
}) {
  const [items, setItems] = useState<any[] | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");

  function load() {
    fetch(endpoint).then(async (r) => setItems(r.ok ? (await r.json()).items : []));
  }
  useEffect(load, [endpoint]);

  function startNew() { setEditing({}); setOpen(true); setErr(""); }
  function startEdit(row: any) { setEditing(row); setOpen(true); setErr(""); }

  async function save(values: Record<string, any>) {
    const isEdit = !!editing?.id;
    const res = await fetch(isEdit ? `${endpoint}/${editing.id}` : endpoint, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    if (res.ok) { setOpen(false); setEditing(null); load(); }
    else setErr((await res.json().catch(() => ({}))).error || "Could not save (check your permissions).");
  }

  async function togglePublished(row: any) {
    setItems((cur) => cur?.map((x) => (x.id === row.id ? { ...x, published: !x.published } : x)) ?? cur);
    await fetch(`${endpoint}/${row.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !row.published }) });
  }

  async function remove(row: any) {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    await fetch(`${endpoint}/${row.id}`, { method: "DELETE" });
    load();
  }

  return (
    <Panel title="Manage" action={<button onClick={startNew} className="rounded-full bg-midnight px-4 py-2 text-sm font-600 text-cream hover:bg-royal">+ {newLabel}</button>}>
      {!items ? (
        <p className="text-slatey">Loading…</p>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-slatey">Nothing yet. Click “{newLabel}” to add the first one.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slatey">
              <tr>{columns.map((c) => <th key={c.key} className="px-3 py-2">{c.label}</th>)}{hasPublished && <th className="px-3 py-2">Live</th>}<th className="px-3 py-2 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {items.map((row) => (
                <tr key={row.id} className="hover:bg-cream/60">
                  {columns.map((c) => <td key={c.key} className="px-3 py-2.5 align-top">{c.render ? c.render(row) : String(row[c.key] ?? "")}</td>)}
                  {hasPublished && (
                    <td className="px-3 py-2.5">
                      <button onClick={() => togglePublished(row)} className={`rounded-full px-2.5 py-1 text-xs font-600 ${row.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {row.published ? "Published" : "Hidden"}
                      </button>
                    </td>
                  )}
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => startEdit(row)} className="rounded-md px-2 py-1 text-xs font-600 text-ink hover:bg-cream">Edit</button>
                    <button onClick={() => remove(row)} className="rounded-md px-2 py-1 text-xs font-600 text-red-600 hover:bg-red-50">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && editing && (
        <Modal fields={fields} hasPublished={hasPublished} initial={editing} err={err} onClose={() => { setOpen(false); setEditing(null); }} onSave={save} />
      )}
    </Panel>
  );
}

function Modal({ fields, initial, hasPublished, err, onClose, onSave }: { fields: Field[]; initial: any; hasPublished: boolean; err: string; onClose: () => void; onSave: (v: Record<string, any>) => void }) {
  const [saving, setSaving] = useState(false);
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true);
    const fd = new FormData(e.currentTarget);
    const v: Record<string, any> = Object.fromEntries(fd.entries());
    if (hasPublished) v.published = fd.get("published") === "on";
    Promise.resolve(onSave(v)).finally(() => setSaving(false));
  }
  const fmtDate = (val: any) => (val ? new Date(val).toISOString().slice(0, 16) : "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-paper p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 font-display text-lg font-700 text-ink">{initial?.id ? "Edit" : "New"}</h3>
        <form onSubmit={submit} className="space-y-3">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="text-sm font-500 text-ink/80">{f.label}{f.required && " *"}</label>
              {f.type === "textarea" ? (
                <textarea name={f.name} rows={4} required={f.required} defaultValue={initial?.[f.name] ?? ""} placeholder={f.placeholder} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold" />
              ) : f.type === "select" ? (
                <select name={f.name} defaultValue={initial?.[f.name] ?? f.options?.[0]?.value} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold">
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input name={f.name} type={f.type === "datetime-local" ? "datetime-local" : f.type === "number" ? "number" : "text"} required={f.required}
                  defaultValue={f.type === "datetime-local" ? fmtDate(initial?.[f.name]) : initial?.[f.name] ?? ""}
                  placeholder={f.placeholder} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold" />
              )}
            </div>
          ))}
          {hasPublished && (
            <label className="flex items-center gap-2 text-sm text-ink/80">
              <input type="checkbox" name="published" defaultChecked={!!initial?.published} className="h-4 w-4 accent-gold" />
              Visible on the home page
            </label>
          )}
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-full border border-ink/15 px-4 py-2 text-sm">Cancel</button>
            <button disabled={saving} className="rounded-full bg-midnight px-4 py-2 text-sm font-600 text-cream hover:bg-royal disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
