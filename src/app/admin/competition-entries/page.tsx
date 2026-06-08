"use client";
import { useEffect, useState } from "react";
import AdminShell, { Panel, StatusPill } from "@/components/admin/Shell";

type Entry = { id: string; refId: string; competitionTitle: string; participation: string; teamName: string | null; leaderName: string; email: string; phone: string; members: string; amount: number; status: string; createdAt: string };

export default function Page() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [competitions, setCompetitions] = useState<{ id: string; title: string }[]>([]);
  const [competition, setCompetition] = useState("");
  const [status, setStatus] = useState("");
  const [participation, setParticipation] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  function load() {
    const qs = new URLSearchParams({ ...(competition && { competition }), ...(status && { status }), ...(participation && { participation }) });
    fetch(`/api/admin/competition-entries?${qs}`).then(async (r) => {
      if (!r.ok) return;
      const d = await r.json(); setEntries(d.entries); setCompetitions(d.competitions || []);
    });
  }
  useEffect(load, [competition, status, participation]);

  const csvHref = `/api/admin/competition-entries?format=csv${competition ? `&competition=${competition}` : ""}${status ? `&status=${status}` : ""}${participation ? `&participation=${participation}` : ""}`;

  return (
    <AdminShell title="Competition entries">
      <Panel title="Entries" action={<a href={csvHref} className="rounded-full border border-ink/15 px-4 py-2 text-sm font-600 text-ink hover:border-gold">Export CSV</a>}>
        <div className="mb-4 flex flex-wrap gap-2">
          <select value={competition} onChange={(e) => setCompetition(e.target.value)} className="rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm">
            <option value="">All competitions</option>
            {competitions.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <select value={participation} onChange={(e) => setParticipation(e.target.value)} className="rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm">
            <option value="">Solo & Group</option><option value="SOLO">Solo</option><option value="GROUP">Group</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm">
            <option value="">Any status</option><option value="PAID">Paid</option><option value="PENDING">Pending</option>
          </select>
        </div>

        {!entries ? <p className="text-slatey">Loading…</p> : entries.length === 0 ? <p className="py-8 text-center text-slatey">No entries yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slatey">
                <tr><th className="px-3 py-2">Ref</th><th className="px-3 py-2">Competition</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Lead / Team</th><th className="px-3 py-2">₹</th><th className="px-3 py-2">Status</th><th className="px-3 py-2"></th></tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {entries.map((e) => {
                  let members: { name: string; age?: number }[] = [];
                  try { members = JSON.parse(e.members); } catch {}
                  return (
                    <tr key={e.id} className="align-top hover:bg-cream/60">
                      <td className="px-3 py-3 font-mono text-xs">{e.refId}</td>
                      <td className="px-3 py-3">{e.competitionTitle}</td>
                      <td className="px-3 py-3">{e.participation === "GROUP" ? "Group" : "Solo"}</td>
                      <td className="px-3 py-3">
                        <p className="font-600 text-ink">{e.teamName || e.leaderName}</p>
                        <p className="text-xs text-slatey">{e.email}</p>
                        {e.participation === "GROUP" && (
                          <button onClick={() => setExpanded(expanded === e.id ? null : e.id)} className="mt-1 text-xs text-gold hover:underline">{expanded === e.id ? "Hide" : `${members.length} members`}</button>
                        )}
                        {expanded === e.id && (
                          <ul className="mt-1 list-disc pl-4 text-xs text-ink/70">{members.map((m, i) => <li key={i}>{m.name}{m.age ? ` (${m.age})` : ""}</li>)}</ul>
                        )}
                      </td>
                      <td className="px-3 py-3 tabular-nums">{(e.amount / 100).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-3"><StatusPill s={e.status} /></td>
                      <td className="px-3 py-3 text-xs text-slatey">{new Date(e.createdAt).toLocaleDateString("en-IN")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
