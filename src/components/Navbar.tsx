"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
<<<<<<< HEAD
      className={`fixed inset-x-0 top-8 z-50 transition-all duration-300 border-b bg-[#1F0A02] ${
=======
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 border-b ${
>>>>>>> 6dcfc9db2667d6f2b77bb43683c7b75d0704bf57
        scrolled
          ? "shadow-lg shadow-[#1F0A02]/30 border-[#D97706]/40 h-24"
          : "border-[#D97706]/20 h-28"
      }`}
    >
<<<<<<< HEAD
      <nav className="mx-auto max-w-6xl px-5 flex items-center justify-between h-full">
        {/* Logo left */}
        <Link href="/" className="inline-block group shrink-0">
          <img
            src="/logos/IMG_7820_textwhite.png"
            alt="Global Youth Summit 2026"
            className="h-24 md:h-28 w-auto object-contain transition-all duration-300 group-hover:brightness-130 group-hover:drop-shadow-lg filter saturate-120 contrast-110 brightness-115"
=======
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2">
        <Link href="/" className="inline-block group">
          <img
            src="/logos/IMG_7820_textwhite.png"
            alt="Global Youth Summit 2026"
            className="h-[110px] md:h-[140px] w-auto object-contain transition-all duration-300 group-hover:brightness-130 group-hover:drop-shadow-lg filter saturate-120 contrast-110 brightness-115"
>>>>>>> 6dcfc9db2667d6f2b77bb43683c7b75d0704bf57
          />
        </Link>

        {/* Links center */}
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
        </div>

        {/* CTA right */}
        <div className="hidden md:flex shrink-0">
          <Link
            href="/register"
            className={`group relative overflow-hidden rounded-full px-6 py-2.5 text-sm font-700 transition-all duration-300 shadow-md ${
              isActive("/register")
                ? "bg-[#B45309] text-white shadow-[#B45309]/20"
                : "bg-[#D97706] text-white shadow-[#D97706]/20 hover:bg-[#B45309] hover:shadow-[#B45309]/30 hover:-translate-y-0.5 active:translate-y-0"
            }`}
          >
            <span className="relative z-10">Register Now ↗</span>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] ease-out bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-12" />
          </Link>
        </div>

        {/* mobile hamburger button */}
        <button
          aria-label="Toggle menu"
          className="md:hidden text-[#FFF8E7] p-2"
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
        <div className="border-t border-[#D97706]/30 bg-[#1F0A02]/98 backdrop-blur px-5 pb-6 pt-2">
          {[
            { href: "/", label: "Home" },
            ...about,
            ...resources,
            { href: "/#contact", label: "Contact" }
          ].map((i) => (
            <Link
              key={i.label}
              href={i.href}
              onClick={() => setOpen(false)}
              className={`flex items-center justify-between border-b border-[#D97706]/10 py-3 text-sm transition ${
                isActive(i.href)
                  ? "text-[#F59E0B] font-600"
                  : "text-[#FFF8E7]/80 hover:text-[#F59E0B]"
              }`}
            >
              {i.label}
              {isActive(i.href) && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
              )}
            </Link>
          ))}
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-full bg-[#D97706] py-3 text-center font-600 text-white hover:bg-[#B45309] transition"
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
      className={`relative text-sm font-600 transition ${
        active ? "text-[#F59E0B]" : "text-[#FFF8E7]/85 hover:text-[#F59E0B]"
      }`}
    >
      {label}
      {active && (
        <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-[#F59E0B]" />
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        if (open) setActive(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setActive]);

  const toggle = () => {
    setActive(open ? null : name);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        type="button"
        className={`relative flex items-center gap-1 text-sm font-600 transition outline-none ${
          groupActive ? "text-[#F59E0B]" : "text-[#FFF8E7]/85 hover:text-[#F59E0B]"
        }`}
      >
        {name}
        <span className={`text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
        {groupActive && (
          <span className="absolute -bottom-1 left-0 h-0.5 w-[calc(100%-10px)] rounded-full bg-[#F59E0B]" />
        )}
      </button>
      <div
        className={`absolute left-0 top-full mt-3 w-56 rounded-xl border border-[#D97706]/30 bg-[#1F0A02]/98 p-2 shadow-2xl backdrop-blur-md transition-all duration-300 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        {items.map((i) => {
          const itemActive = pathname === i.href || (i.href !== "/" && pathname.startsWith(i.href));
          return (
            <Link
              key={i.label}
              href={i.href}
              onClick={() => setActive(null)}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                itemActive
                  ? "bg-[#D97706]/20 text-[#F59E0B] font-600"
                  : "text-[#FFF8E7]/90 hover:bg-white/5 hover:text-[#F59E0B]"
              }`}
            >
              {i.label}
              {itemActive && <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
