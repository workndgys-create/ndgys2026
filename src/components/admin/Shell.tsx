"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { canFromList, Action } from "@/lib/permissions";

type NavItem = { href: string; label: string; icon: string; perm: Action };
type NavGroup = { title: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  { title: "Operations", items: [
    { href: "/admin", label: "Dashboard", icon: "▤", perm: "registrations.read" },
    { href: "/admin/registrations", label: "Registrations", icon: "❏", perm: "registrations.read" },
    { href: "/admin/form-builder", label: "Form Builder", icon: "✎", perm: "content.manage" },
    { href: "/admin/allocations", label: "Allocations", icon: "⚑", perm: "allocations.manage" },
    { href: "/admin/portfolios", label: "Portfolios", icon: "▥", perm: "allocations.manage" },
    { href: "/admin/checkin", label: "Check-in", icon: "✓", perm: "checkin.manage" },
    { href: "/admin/badges", label: "Badges", icon: "▦", perm: "badges.read" },
    { href: "/admin/competition-entries", label: "Competition Entries", icon: "▣", perm: "registrations.read" },
    { href: "/admin/delegations", label: "Delegations", icon: "▤", perm: "registrations.read" },
    { href: "/admin/messages", label: "Messages", icon: "✉", perm: "messages.read" }
  ]},
  { title: "Content", items: [
    { href: "/admin/events", label: "Events", icon: "◆", perm: "content.read" },
    { href: "/admin/competitions", label: "Competitions", icon: "🏆", perm: "content.read" },
    { href: "/admin/flow", label: "Event Flow", icon: "↧", perm: "content.read" },
    { href: "/admin/speakers", label: "Speakers", icon: "🎙", perm: "content.read" },
    { href: "/admin/secretariat", label: "Secretariat", icon: "❖", perm: "content.read" },
    { href: "/admin/sponsors", label: "Sponsors", icon: "◈", perm: "content.read" },
    { href: "/admin/accommodation", label: "Stay & Travel", icon: "⌂", perm: "content.read" },
    { href: "/admin/guides", label: "Study Guides", icon: "▢", perm: "content.manage" },
    { href: "/admin/background-guides", label: "Background Guides", icon: "▣", perm: "content.manage" },
    { href: "/admin/announcements", label: "Announcements", icon: "◈", perm: "announcements.manage" }
  ]},
  { title: "Administration", items: [
    { href: "/admin/team", label: "Team & Roles", icon: "👥", perm: "team.manage" },
    { href: "/admin/promo-codes", label: "Promo Codes", icon: "%", perm: "settings.manage" },
    { href: "/admin/settings", label: "Settings", icon: "⚙", perm: "settings.manage" }
  ]}
];

export default function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [perms, setPerms] = useState<string[] | null>(null);
  const [me, setMe] = useState<{ role: string; email: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/me").then(async (r) => {
      if (r.status === 401) return router.push("/admin/login");
      const d = await r.json();
      setPerms(d.permissions ?? []);
      setMe({ role: d.role, email: d.email });
    }).catch(() => setPerms([]));
  }, [router]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login"); router.refresh();
  }

  const allow = (p: Action) => (perms ? canFromList(perms, p) : false);

  return (
    <div className="flex min-h-screen bg-cream text-ink">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto border-r border-white/10 bg-ink text-cream transition-transform md:static md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-display text-lg font-700">NDGYS<span className="text-gold">.</span><span className="ml-2 text-xs font-400 text-cream/50">Admin</span></Link>
          <button className="text-cream/60 md:hidden" onClick={() => setOpen(false)} aria-label="Close menu">✕</button>
        </div>
        <nav className="space-y-5 px-3 pb-28">
          {GROUPS.map((g) => {
            const items = g.items.filter((n) => allow(n.perm));
            if (items.length === 0) return null;
            return (
              <div key={g.title}>
                <p className="px-3 pb-1 text-[10px] uppercase tracking-widest text-cream/40">{g.title}</p>
                {items.map((n) => {
                  const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
                  return (
                    <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active ? "bg-white/10 text-gold" : "text-cream/75 hover:bg-white/5 hover:text-cream"}`}>
                      <span className="w-4 text-center">{n.icon}</span>{n.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-ink p-4">
          {me && <p className="mb-2 truncate text-xs text-cream/50">{me.email} · {me.role.replace("_", " ")}</p>}
          <button onClick={logout} className="w-full rounded-full border border-white/20 py-2 text-sm text-cream/85 hover:border-gold hover:text-gold">Sign out</button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink/10 bg-paper/90 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <button className="text-ink md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
            <h1 className="font-display text-xl font-700">{title}</h1>
          </div>
          <Link href="/" className="text-sm text-slatey hover:text-ink">View site ↗</Link>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-7">{children}</main>
      </div>
    </div>
  );
}

export const KpiCard = ({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) => (
  <div className="rounded-2xl border border-ink/10 bg-paper p-5">
    <p className="text-xs uppercase tracking-wider text-slatey">{label}</p>
    <p className="mt-2 font-display text-3xl font-700 text-ink">{value}</p>
    {sub && <p className="mt-1 text-xs text-slatey">{sub}</p>}
  </div>
);
export const StatusPill = ({ s }: { s: string }) => {
  const map: Record<string, string> = { PAID: "bg-green-100 text-green-700", PENDING: "bg-amber-100 text-amber-700", CANCELLED: "bg-red-100 text-red-700" };
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-600 ${map[s] || "bg-gray-100 text-gray-600"}`}>{s}</span>;
};
export const Panel = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <section className="rounded-2xl border border-ink/10 bg-paper p-5">
    <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-700">{title}</h2>{action}</div>
    {children}
  </section>
);
