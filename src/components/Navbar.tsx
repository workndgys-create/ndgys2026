"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const about = [
  { href: "/about", label: "About the Summit" },
  { href: "/committees", label: "Committees" },
  { href: "/schedule", label: "Schedule" },
  { href: "/venue", label: "Venue & Travel" }
];
const resources = [
  { href: "/#resources", label: "Delegate Guides" },
  { href: "/#faq", label: "FAQ" }
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all ${
        scrolled ? "bg-midnight/95 shadow-lg shadow-black/20 backdrop-blur" : "bg-midnight"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="font-display text-lg font-700 tracking-tight text-cream">
          NDGYS<span className="text-gold">.</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <Link href="/" className="text-sm text-cream/80 hover:text-gold">Home</Link>
          <Dropdown name="About" items={about} active={menu} setActive={setMenu} />
          <Dropdown name="Resources" items={resources} active={menu} setActive={setMenu} />
          <Link href="/#contact" className="text-sm text-cream/80 hover:text-gold">Contact</Link>
          <Link
            href="/register"
            className="rounded-full bg-gold px-5 py-2 text-sm font-600 text-midnight transition hover:bg-goldlite"
          >
            Register Now
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          className="md:hidden text-cream"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="space-y-1.5">
            <span className={`block h-0.5 w-6 bg-current transition ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-6 bg-current transition ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-6 bg-current transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </div>
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-midnight px-5 pb-6 pt-2">
          {[{ href: "/", label: "Home" }, ...about, ...resources, { href: "/#contact", label: "Contact" }].map((i) => (
            <Link
              key={i.label}
              href={i.href}
              onClick={() => setOpen(false)}
              className="block border-b border-white/5 py-3 text-cream/85"
            >
              {i.label}
            </Link>
          ))}
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-full bg-gold py-3 text-center font-600 text-midnight"
          >
            Register Now
          </Link>
        </div>
      )}
    </header>
  );
}

function Dropdown({
  name,
  items,
  active,
  setActive
}: {
  name: string;
  items: { href: string; label: string }[];
  active: string | null;
  setActive: (v: string | null) => void;
}) {
  const open = active === name;
  return (
    <div className="relative" onMouseEnter={() => setActive(name)} onMouseLeave={() => setActive(null)}>
      <button className="flex items-center gap-1 text-sm text-cream/80 hover:text-gold">
        {name}
        <span className={`text-xs transition ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full w-56 rounded-xl border border-white/10 bg-royal p-2 shadow-xl">
          {items.map((i) => (
            <Link key={i.label} href={i.href} className="block rounded-lg px-3 py-2 text-sm text-cream/85 hover:bg-white/5 hover:text-gold">
              {i.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
