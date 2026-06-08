"use client";
import { useEffect, useState } from "react";
import AdminShell, { Panel, StatusPill } from "@/components/admin/Shell";

type D = { id: string; schoolName: string; headName: string; email: string; memberCount: number; amount: number; status: string; promoCode: string | null; createdAt: string };

export default function Page() {
  const [rows, setRows] = useState<D[] | null>(null);
  useEffect(() => { fetch("/api/admin/delegations").then(async (r) => { if (r.ok) setRows((await r.json()).delegations); }); }, []);
  return (
    <AdminShell title="Delegations">
      <Panel title="School / group registrations">
        {!rows ? <p className="text-slatey">Loading…</p> : rows.length === 0 ? <p className="py-8 text-center text-slatey">No delegations yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slatey">
                <tr><th className="px-3 py-2">School</th><th className="px-3 py-2">Lead</th><th className="px-3 py-2">Delegates</th><th className="px-3 py-2">₹</th><th className="px-3 py-2">Code</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Created</th></tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {rows.map((d) => (
                  <tr key={d.id} className="hover:bg-cream/60">
                    <td className="px-3 py-3 font-600 text-ink">{d.schoolName}</td>
                    <td className="px-3 py-3"><p>{d.headName}</p><p className="text-xs text-slatey">{d.email}</p></td>
                    <td className="px-3 py-3 tabular-nums">{d.memberCount}</td>
                    <td className="px-3 py-3 tabular-nums">{d.amount.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-3 font-mono text-xs">{d.promoCode || "—"}</td>
                    <td className="px-3 py-3"><StatusPill s={d.status} /></td>
                    <td className="px-3 py-3 text-xs text-slatey">{new Date(d.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
