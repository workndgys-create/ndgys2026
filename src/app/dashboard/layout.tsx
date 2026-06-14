import Link from "next/link";
import LogoutButton from "@/components/dashboard/LogoutButton";
import { currentDelegate, allDelegateRegistrations } from "@/lib/delegateSession";
import RegistrationSwitcher from "@/components/dashboard/RegistrationSwitcher";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/registration", label: "My Participation" },
  { href: "/dashboard/ticket", label: "Pass & QR" },
  { href: "/dashboard/schedule", label: "My Schedule" },
  { href: "/dashboard/committee", label: "Event Group" },
  { href: "/dashboard/guides", label: "Rules & Regulations" },
  { href: "/dashboard/profile", label: "Profile" }
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const me = await currentDelegate();
  const regs = await allDelegateRegistrations();
  const isComp = me ? (me as any).isCompetition : false;

  const filteredNav = nav.filter((n) => {
    if (isComp && n.href === "/dashboard/committee") return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-cream grain">
      <header className="flex items-center justify-between border-b border-ink/10 bg-midnight px-5 py-4 text-cream">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img
            src="/NDGYS26.png"
            alt="NDGYS 4.0 Logo"
            className="h-10 w-auto object-contain md:h-12"
          />
          <span className="text-sm font-400 text-cream/60">Participant</span>
        </Link>
        {me ? (
          <LogoutButton endpoint="/api/delegate/auth/logout" redirect="/dashboard/login" />
        ) : null}
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 md:flex-row">
        {me ? (
          <nav className="flex w-full justify-center gap-2 overflow-x-auto md:w-56 md:flex-col md:justify-start shrink-0">
            {me && regs.length > 1 && (
              <RegistrationSwitcher currentId={me.id} registrations={regs} />
            )}
            {filteredNav.map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-500 text-ink/75 hover:bg-paper hover:text-ink">
                {n.label}
              </Link>
            ))}
          </nav>
        ) : null}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
