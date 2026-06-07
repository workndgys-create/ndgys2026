import Link from "next/link";
import LogoutButton from "@/components/dashboard/LogoutButton";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/registration", label: "My Registration" },
  { href: "/dashboard/ticket", label: "Ticket & QR" },
  { href: "/dashboard/schedule", label: "My Schedule" },
  { href: "/dashboard/committee", label: "Committee" },
  { href: "/dashboard/guides", label: "Study Guides" },
  { href: "/dashboard/profile", label: "Profile" }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream grain">
      <header className="flex items-center justify-between border-b border-ink/10 bg-midnight px-5 py-4 text-cream">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img
            src="/NDGYS26.png"
            alt="NDGYS 2026 Logo"
            className="h-10 w-auto object-contain md:h-12"
          />
          <span className="text-sm font-400 text-cream/60">Delegate</span>
        </Link>
        <LogoutButton endpoint="/api/delegate/auth/logout" redirect="/dashboard/login" />
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 md:flex-row">
        <nav className="flex gap-2 overflow-x-auto md:w-56 md:flex-col">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-500 text-ink/75 hover:bg-paper hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
