"use client";
import { useEffect, useState } from "react";

export default function TeamsEditor({ competitionId }: { competitionId: string }) {
  const [teams, setTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [newName, setNewName] = useState("");

  async function load() {
    setLoading(true); setErr("");
    const res = await fetch(`/api/admin/competitions/${competitionId}/teams`);
    if (!res.ok) { setErr("Could not load teams"); setLoading(false); return; }
    const d = await res.json().catch(() => ({}));
    setTeams(d.teams || []); setLoading(false);
  }

  useEffect(() => { if (competitionId) load(); }, [competitionId]);

  async function add() {
    if (!newName.trim()) return;
    const res = await fetch(`/api/admin/competitions/${competitionId}/teams`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName.trim() }) });
    if (!res.ok) return alert("Could not add team");
    const d = await res.json(); setTeams(d.teams || []); setNewName("");
  }

  async function update(i: number, name: string) {
    const res = await fetch(`/api/admin/competitions/${competitionId}/teams`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index: i, name }) });
    if (!res.ok) return alert("Could not update");
    const d = await res.json(); setTeams(d.teams || []);
  }

  async function remove(i: number) {
    if (!confirm("Delete this team?")) return;
    const res = await fetch(`/api/admin/competitions/${competitionId}/teams`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index: i }) });
    if (!res.ok) return alert("Could not delete");
    const d = await res.json(); setTeams(d.teams || []);
  }

  async function move(i: number, dir: -1 | 1) {
    const arr = [...teams];
    const j = i + dir; if (j < 0 || j >= arr.length) return;
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    const res = await fetch(`/api/admin/competitions/${competitionId}/teams`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teams: arr }) });
    if (!res.ok) return alert("Could not reorder");
    const d = await res.json(); setTeams(d.teams || []);
  }

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-600">Teams</h4>
      {err && <p className="text-xs text-red-600">{err}</p>}
      {loading ? <p className="text-slatey">Loading…</p> : (
        <div className="space-y-2">
          {teams.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <input defaultValue={t} onBlur={(e) => update(i, e.target.value)} className="flex-1 rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm" />
              <button onClick={() => move(i, -1)} disabled={i === 0} className="px-2 py-1 text-sm">↑</button>
              <button onClick={() => move(i, 1)} disabled={i === teams.length - 1} className="px-2 py-1 text-sm">↓</button>
              <button onClick={() => remove(i)} className="px-2 py-1 text-sm text-red-600">Delete</button>
            </div>
          ))}
          <div className="flex gap-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New team name" className="flex-1 rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm" />
            <button onClick={add} className="rounded-full bg-midnight px-3 py-2 text-sm font-600 text-cream">Add</button>
          </div>
        </div>
      )}
    </div>
  );
}
