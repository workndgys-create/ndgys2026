"use client";
import { useEffect, useState } from "react";
import AdminShell, { Panel, StatusPill } from "@/components/admin/Shell";
import { downloadFileFromUrl } from "@/lib/download";

type Entry = { 
  id: string; refId: string; competitionTitle: string; participation: string; 
  teamName: string | null; leaderName: string; email: string; phone: string; 
  members: string; amount: number; status: string; createdAt: string;
  age?: number; gender?: string; city?: string; emergencyContact?: string;
  howHeard?: string; pastExperience?: string; answers?: string; notes?: string;
};

export default function Page() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [competitions, setCompetitions] = useState<{ id: string; title: string }[]>([]);
  const [competition, setCompetition] = useState("");
  const [status, setStatus] = useState("");
  const [participation, setParticipation] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  
  const [viewEntry, setViewEntry] = useState<Entry | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [badgeError, setBadgeError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  function load() {
    const qs = new URLSearchParams({ ...(competition && { competition }), ...(status && { status }), ...(participation && { participation }) });
    fetch(`/api/admin/competition-entries?${qs}`).then(async (r) => {
      if (!r.ok) return;
      const d = await r.json(); setEntries(d.entries); setCompetitions(d.competitions || []);
    });
  }
  useEffect(load, [competition, status, participation]);

  async function changeStatus(id: string, next: string) {
    await fetch(`/api/admin/competition-entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next })
    });
    load();
  }

  async function downloadBadge(id: string, refId: string) {
    try {
      setBadgeError("");
      await downloadFileFromUrl(`/api/admin/badges?id=${id}`, `badge-${refId}.pdf`);
    } catch (error) {
      setBadgeError(error instanceof Error ? error.message : "Could not download badge.");
    }
  }

  async function viewCompetitionEntry(id: string) {
    setViewLoading(true);
    setViewEntry(null);
    try {
      const r = await fetch(`/api/admin/competition-entries/${id}`);
      const data = await r.json();
      if (data.entry) setViewEntry(data.entry);
      else setActionMessage("Could not load entry.");
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Failed to load entry.");
    } finally {
      setViewLoading(false);
    }
  }

  async function deleteCompetitionEntry(id: string) {
    if (!confirm("Are you sure you want to delete this competition entry?")) return;
    try {
      const r = await fetch(`/api/admin/competition-entries/${id}`, { method: "DELETE" });
      const data = await r.json();
      if (r.ok && data.ok) {
        setEntries((cur) => cur ? cur.filter((it) => it.id !== id) : null);
        setActionMessage("Entry deleted.");
      } else {
        setActionMessage(data.error || "Failed to delete entry.");
      }
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Failed to delete entry.");
    }
    setTimeout(() => setActionMessage(""), 3000);
  }

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
                <tr>
                  <th className="px-3 py-2">Ref</th>
                  <th className="px-3 py-2">Competition</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Lead / Team</th>
                  <th className="px-3 py-2">₹</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
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
                      <td className="px-3 py-3 tabular-nums">{e.amount.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-3"><StatusPill s={e.status} /></td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button onClick={() => viewCompetitionEntry(e.id)} className="rounded-md border border-ink/15 px-2 py-0.5 text-xs font-600 text-ink hover:border-gold">View</button>
                          {e.status === "PAID" && (
                            <button onClick={() => downloadBadge(e.id, e.refId)} className="rounded-md border border-ink/15 px-2 py-0.5 text-xs font-600 text-ink hover:border-gold">Badge</button>
                          )}
                          <select
                            defaultValue=""
                            onChange={(evt) => { if (evt.target.value) changeStatus(e.id, evt.target.value); evt.target.value = ""; }}
                            className="rounded-md border border-ink/15 bg-cream px-1.5 py-0.5 text-xs"
                          >
                            <option value="">Set status…</option>
                            <option value="PAID">Mark Paid</option>
                            <option value="PENDING">Mark Pending</option>
                            <option value="CANCELLED">Mark Cancelled</option>
                          </select>
                          <button onClick={() => deleteCompetitionEntry(e.id)} className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-600 text-cream hover:bg-red-700">Delete</button>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-slatey">{new Date(e.createdAt).toLocaleDateString("en-IN")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {badgeError && <p className="mt-3 text-sm text-red-600">{badgeError}</p>}
      {actionMessage && <p className="mt-3 text-sm text-slatey">{actionMessage}</p>}

      {viewEntry !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewEntry(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <Panel title={viewEntry ? `Competition Entry: ${viewEntry.refId}` : "Loading…"}>
              {viewLoading && !viewEntry && <p className="text-slatey">Loading…</p>}
              {viewEntry && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div><strong>Competition:</strong> {viewEntry.competitionTitle}</div>
                    <div><strong>Format:</strong> {viewEntry.participation}</div>
                    {viewEntry.teamName && <div><strong>Team Name:</strong> {viewEntry.teamName}</div>}
                    <div><strong>Leader Name:</strong> {viewEntry.leaderName}</div>
                    <div><strong>Email:</strong> {viewEntry.email}</div>
                    <div><strong>Phone:</strong> {viewEntry.phone}</div>
                    <div><strong>Age:</strong> {viewEntry.age || "—"}</div>
                    <div><strong>Gender:</strong> {viewEntry.gender || "—"}</div>
                    <div><strong>City:</strong> {viewEntry.city || "—"}</div>
                    <div><strong>Emergency Contact:</strong> {viewEntry.emergencyContact || "—"}</div>
                    <div><strong>Amount Paid:</strong> ₹{(viewEntry.amount || 0).toLocaleString("en-IN")}</div>
                    <div><strong>Status:</strong> {viewEntry.status}</div>
                    <div><strong>How Heard:</strong> {viewEntry.howHeard || "—"}</div>
                    <div><strong>Registered At:</strong> {new Date(viewEntry.createdAt).toLocaleString()}</div>
                  </div>
                  
                  {viewEntry.pastExperience && (
                    <div className="text-sm">
                      <strong>Past Experience:</strong>
                      <p className="mt-1 bg-cream/30 p-2.5 rounded-lg text-ink/80">{viewEntry.pastExperience}</p>
                    </div>
                  )}
                  
                  {viewEntry.notes && (
                    <div className="text-sm">
                      <strong>Admin Notes:</strong>
                      <p className="mt-1 bg-cream/30 p-2.5 rounded-lg text-ink/80">{viewEntry.notes}</p>
                    </div>
                  )}

                  {/* Render custom answers */}
                  {(() => {
                    let parsedAnswers: { q: string; a: string }[] = [];
                    try { parsedAnswers = JSON.parse(viewEntry.answers || "[]"); } catch {}
                    if (parsedAnswers.length === 0) return null;
                    return (
                      <div className="space-y-2 text-sm border-t border-ink/5 pt-3">
                        <h4 className="font-700 text-ink">Custom Questions Answers</h4>
                        {parsedAnswers.map((x, i) => (
                          <div key={i} className="bg-cream/20 p-2 rounded-lg">
                            <p className="font-600 text-ink">{x.q}</p>
                            <p className="text-ink/80">{x.a}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Render team members */}
                  {(() => {
                    let parsedMembers: { name: string; age?: number }[] = [];
                    try { parsedMembers = JSON.parse(viewEntry.members || "[]"); } catch {}
                    if (parsedMembers.length === 0) return null;
                    return (
                      <div className="space-y-2 text-sm border-t border-ink/5 pt-3">
                        <h4 className="font-700 text-ink">Team Members ({parsedMembers.length})</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {parsedMembers.map((m, i) => (
                            <li key={i}>{m.name}{m.age ? ` (Age: ${m.age})` : ""}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                </div>
              )}
              <div className="flex justify-end pt-4 border-t border-ink/5 mt-4">
                <button onClick={() => setViewEntry(null)} className="rounded-full border border-ink/15 px-4 py-2 text-sm">Close</button>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
