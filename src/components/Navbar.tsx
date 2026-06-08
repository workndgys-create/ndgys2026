"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const about = [
  { href: "/about", label: "About the Summit" },
  { href: "/committees", label: "Committees" },
  { href: "/schedule", label: "Schedule" }
];
const resources = [
  { href: "/#resources", label: "Delegate Guides" },
  { href: "/#faq", label: "FAQ" }
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close mobile menu on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isGroupActive = (items: { href: string }[]) =>
    items.some((i) => isActive(i.href));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 border-b ${
      
     
        scrolled
          ? "bg-midnight/90 backdrop-blur-md shadow-lg shadow-black/15 border-gold/25 py-2"
          : "bg-midnight/30 border-transparent py-4"
      }`}
    >
<<<<<<< HEAD
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center py-1">
          <img
            src="/NDGYS26.png"
            alt="NDGYS 2026 Logo"
            className="h-16 w-auto object-contain md:h-20 transition-all duration-200"
=======
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2">
        <Link href="/" className="inline-block group">
          <img
            src="/logos/IMG_7820.png"
            alt="Global Youth Summit 2026"
            className="h-[100px] md:h-[130px] w-auto object-contain transition-all duration-300 group-hover:brightness-130 group-hover:drop-shadow-lg filter saturate-120 contrast-110 brightness-110"
>>>>>>> 4e827c2 (Replace navbar NDGYS text with transparent Global Youth Summit logo; add image-processing scripts and styling)
          />
        </Link>

        {/* desktop links */}
        <div className="hidden items-center gap-7 md:flex">
          <NavLink href="/" label="Home" active={isActive("/")} />
          <Dropdown
            name="About"
            items={about}
            active={menu}
            setActive={setMenu}
            groupActive={isGroupActive(about)}
          />
          <Dropdown
            name="Resources"
            items={resources}
            active={menu}
            setActive={setMenu}
            groupActive={isGroupActive(resources)}
          />
          <NavLink href="/#contact" label="Contact" active={false} />
          <Link
            href="/register"
            className={`group relative overflow-hidden rounded-full px-5 py-2 text-sm font-600 transition-all duration-300 shadow-md ${
              isActive("/register")
                ? "bg-goldlite text-midnight shadow-goldlite/10"
                : "bg-gold text-midnight shadow-gold/15 hover:bg-goldlite hover:shadow-gold/35 hover:-translate-y-0.5 active:translate-y-0"
            }`}
          >
            <span className="relative z-10">Register Now ↗</span>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] ease-out bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12" />
          </Link>
        </div>

        {/* hamburger */}
        <button
          aria-label="Toggle menu"
          className="md:hidden text-cream"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="space-y-1.5">
            <span className={`block h-0.5 w-6 bg-current transition-all duration-300 ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-6 bg-current transition-all duration-300 ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-6 bg-current transition-all duration-300 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </div>
        </button>
      </nav>

      {/* mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-white/10 bg-midnight/98 backdrop-blur px-5 pb-6 pt-2">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2">
          <Link href="/" className="inline-block group">
            <img
              src="/logos/IMG_7820.png"
              alt="Global Youth Summit 2026"
              className="h-[100px] md:h-[130px] w-auto object-contain transition-all duration-300 group-hover:brightness-130 group-hover:drop-shadow-lg filter saturate-120 contrast-110 brightness-110"
            <Link
              key={i.label}
              href={i.href}
              onClick={() => setOpen(false)}
              className={`flex items-center justify-between border-b border-white/5 py-3 text-sm transition ${
                isActive(i.href)
                  ? "text-gold font-600"
                  : "text-cream/85 hover:text-gold"
              }`}
            >
              {i.label}
              {isActive(i.href) && (
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              )}
            </Link>
          ))}
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-full bg-gold py-3 text-center font-600 text-midnight hover:bg-goldlite transition"
          >
            Register Now
          </Link>
        </div>
      </div>
    </header>
  );
}

// ── simple nav link with active indicator ──────────────────────────────────
function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`relative text-sm transition ${
        active ? "text-gold" : "text-cream/80 hover:text-gold"
      }`}
    >
      {label}
      {active && (
        <span className="absolute -bottom-1 left-0 h-px w-full rounded-full bg-gold" />
      )}
    </Link>
  );
}

// ── dropdown ───────────────────────────────────────────────────────────────
function Dropdown({
  name,
  items,
  active,
  setActive,
  groupActive
}: {
  name: string;
  items: { href: string; label: string }[];
  active: string | null;
  setActive: (v: string | null) => void;
  groupActive: boolean;
}) {
  const pathname = usePathname();
  const open = active === name;

  return (
    <div
      className="relative"
      onMouseEnter={() => setActive(name)}
      onMouseLeave={() => setActive(null)}
    >
      <button
        className={`relative flex items-center gap-1 text-sm transition ${
          groupActive ? "text-gold" : "text-cream/80 hover:text-gold"
        }`}
      >
        {name}
        <span className={`text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
        {groupActive && (
          <span className="absolute -bottom-1 left-0 h-px w-[calc(100%-10px)] rounded-full bg-gold" />
        )}
      </button>
      <div
        className={`absolute left-0 top-full w-56 rounded-xl border border-gold/15 bg-midnight/95 p-2 shadow-2xl backdrop-blur-md transition-all duration-300 ${
          open ? "opacity-100 translate-y-2 pointer-events-auto" : "opacity-0 translate-y-0 pointer-events-none"
        }`}
      >
        {items.map((i) => {
          const itemActive = pathname === i.href || (i.href !== "/" && pathname.startsWith(i.href));
          return (
            <Link
              key={i.label}
              href={i.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                itemActive
                  ? "bg-white/10 text-gold font-600"
                  : "text-cream/85 hover:bg-white/5 hover:text-gold"
              }`}
            >
              {i.label}
              {itemActive && <span className="h-1.5 w-1.5 rounded-full bg-gold" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
