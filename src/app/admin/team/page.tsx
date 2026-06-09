"use client";
import { useEffect, useState } from "react";
import AdminShell, { Panel } from "@/components/admin/Shell";

type Admin = { id: string; email: string; name: string | null; role: string; active: boolean; lastLoginAt: string | null };
const ROLES = [
  "SUPER_ADMIN",
  "DIRECTOR",
  "HR",
  "DEVELOPER",
  "FINANCE_LEAD",
  "FINANCE_EXECUTIVE",
  "DELEGATE_AFFAIRS_LEAD",
  "DELEGATE_AFFAIRS_EXECUTIVE",
  "VOLUNTEER_COORDINATOR",
  "VOLUNTEER"
];
const ROLE_HELP: Record<string, string> = {
  SUPER_ADMIN: "Complete access to the platform",

  DIRECTOR:
    "Overall event operations and management",

  HR:
    "QR scanning, check-ins, badges and volunteer management",

  DEVELOPER:
    "Platform management, content, settings and system tools",

  FINANCE_LEAD:
    "Payments, invoices, financial reports and exports",

  FINANCE_EXECUTIVE:
    "View payment records only",

  DELEGATE_AFFAIRS_LEAD:
    "Registrations, delegations, support and messaging",

  DELEGATE_AFFAIRS_EXECUTIVE:
    "Registration support and messaging",

  VOLUNTEER_COORDINATOR:
    "Volunteer onboarding, tracking and QR scanning",

  VOLUNTEER:
    "QR scanning and check-in operations"
};

export default function TeamPage() {
  const [admins, setAdmins] = useState<Admin[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");

  function load() {
    fetch("/api/admin/team")
      .then(async (r) => {
        if (r.status === 403) return setForbidden(true);
        const body = await r.json().catch(() => ({}));
        if (!r.ok) {
          setErr(body.error || "Could not load team");
          setAdmins([]);
          return;
        }
        setErr("");
        setAdmins(body.admins ?? []);
      })
      .catch(() => {
        setErr("Could not load team");
        setAdmins([]);
      });
  }
  useEffect(load, []);

  async function update(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/admin/team/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (res.ok) load();
    else alert((await res.json().catch(() => ({}))).error || "Update failed");
  }

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(fd.entries())) });
    if (res.ok) { setOpen(false); load(); }
    else setErr((await res.json().catch(() => ({}))).error || "Could not create admin");
  }

  if (forbidden) {
    return <AdminShell title="Team & Roles"><Panel title="Team"><p className="text-slatey">Only a super-admin can manage the team.</p></Panel></AdminShell>;
  }

  return (
    <AdminShell title="Team & Roles">
      <Panel title="Admin users" action={<button onClick={() => { setOpen(true); setErr(""); }} className="rounded-full bg-midnight px-4 py-2 text-sm font-600 text-cream hover:bg-royal">+ Invite admin</button>}>
        {!admins ? (
          <p className="text-slatey">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            {err && <p className="mb-3 text-sm text-red-600">{err}</p>}
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slatey">
                <tr><th className="px-3 py-2">Admin</th><th className="px-3 py-2">Role (level)</th><th className="px-3 py-2">Active</th><th className="px-3 py-2">Last login</th></tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {admins.map((a) => (
                  <tr key={a.id} className="hover:bg-cream/60">
                    <td className="px-3 py-3"><p className="font-600 text-ink">{a.name || "—"}</p><p className="text-xs text-slatey">{a.email}</p></td>
                    <td className="px-3 py-3">
                      <select value={a.role} onChange={(e) => update(a.id, { role: e.target.value })} className="rounded-md border border-ink/15 bg-cream px-2 py-1 text-xs">
                        {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                      </select>
                      <p className="mt-1 text-[11px] text-slatey">{ROLE_HELP[a.role]}</p>
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => update(a.id, { active: !a.active })} className={`rounded-full px-2.5 py-1 text-xs font-600 ${a.active ? "bg-[#D97706]/20 text-[#92400E]" : "bg-[#3B1A0A]/10 text-[#3B1A0A]/50"}`}>
                        {a.active ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-slatey">{a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-paper p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 font-display text-lg font-700 text-ink">Invite admin</h3>
            <form onSubmit={create} className="space-y-3">
              <input name="name" placeholder="Name" className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold" />
              <input name="email" type="email" required placeholder="Email" className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold" />
              <select name="role" defaultValue="VOLUNTEER" className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold">
                {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")} — {ROLE_HELP[r]}</option>)}
              </select>
              <input name="password" type="text" required minLength={8} placeholder="Temporary password (min 8 chars)" className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold" />
              <p className="text-xs text-slatey">Share the temporary password securely; they can change it later.</p>
              {err && <p className="text-sm text-red-600">{err}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-ink/15 px-4 py-2 text-sm">Cancel</button>
                <button className="rounded-full bg-midnight px-4 py-2 text-sm font-600 text-cream hover:bg-royal">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
