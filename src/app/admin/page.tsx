"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell, { KpiCard, Panel } from "@/components/admin/Shell";
import { LineSeries, CapacityBars, Donut } from "@/components/admin/Charts";

type Entries = {
  summary: { paid: number; pending: number; cancelled: number; revenueInr: number; todaySignups: number; unreadMessages: number; total: number };
  perTrack: { name: string; paid: number; capacity: number }[];
  series: { date: string; count: number; revenue: number }[];
  experience: { beginner: number; experienced: number };
  recent: { id: string; adminEmail: string; action: string; entity: string; meta: string | null; createdAt: string }[];
};

export default function AdminDashboard() {
  const router = useRouter();
  const [d, setD] = useState<Entries | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/admin/entries")
      .then(async (r) => {
        if (r.status === 401) return router.push("/admin/login");
        if (!r.ok) throw new Error();
        setD(await r.json());
      })
      .catch(() => setErr("Could not load dashboard data."));
  }, [router]);

  return (
    <AdminShell title="Dashboard">
      {err && <p className="text-red-600">{err}</p>}
      {!d ? (
        <p className="text-slatey">Loading…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <KpiCard label="Paid delegates" value={d.summary.paid} sub={`${d.summary.total} total registrations`} />
            <KpiCard label="Pending" value={d.summary.pending} sub={`${d.summary.cancelled} cancelled`} />
            <KpiCard label="Today" value={d.summary.todaySignups} sub={`${d.summary.unreadMessages} unread messages`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Panel title="Registrations · last 14 days">
                <LineSeries data={d.series} />
              </Panel>
            </div>
            <Panel title="Experience mix">
              <Donut beginner={d.experience.beginner} experienced={d.experience.experienced} />
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Committee capacity">
              <CapacityBars data={d.perTrack} />
            </Panel>
            <Panel title="Recent activity">
              {d.recent.length === 0 ? (
                <p className="text-sm text-slatey">No activity logged yet.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {d.recent.map((a) => (
                    <li key={a.id} className="flex items-start justify-between gap-3 border-b border-ink/5 pb-2 last:border-0">
                      <div>
                        <span className="font-600 text-ink">{a.action}</span>
                        <span className="text-slatey"> · {a.entity}{a.meta ? ` (${a.meta})` : ""}</span>
                        <p className="text-xs text-slatey">{a.adminEmail}</p>
                      </div>
                      <time className="shrink-0 text-xs text-slatey">{new Date(a.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</time>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
