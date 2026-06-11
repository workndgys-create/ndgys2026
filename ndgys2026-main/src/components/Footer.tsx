import Link from "next/link";

const quick = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/committees", label: "Committees" },
  { href: "/#contact", label: "Contact" }
];
const resources = [
  { href: "/#resources", label: "Delegate Guides" },
  { href: "/#faq", label: "FAQs" },
  { href: "/schedule", label: "Schedule" },
  { href: "/dashboard", label: "Participant Login" }
];
// ── Social links — replace # with your actual URLs ──────────────────────
const socials = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/globalyouthsummit.gys?igsh=N2c0NTJrMXRkd3Jn",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    )
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/_ndgys",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@socialhouselearning?si=sFIHsf2fZLKkBZMb",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/new-delhi-global-youth-summit/",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    )
  }
];


export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#2A1005] text-cream">
      <div className="mx-auto max-w-6xl px-5 pt-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* brand column */}
          <div>
            <Link href="/" className="inline-block max-w-full">
              <img
                src="/NDGYS26.png"
                alt="NDGYS 4.0 Logo"
                className="max-h-16 w-auto max-w-[220px] object-contain object-left md:max-h-20 md:max-w-[260px]"
              />
            </Link>
            <p className="mt-3 max-w-xs text-sm text-cream/60">
              Empowering the next generation of global leaders through diplomacy and debate.
            </p>

            {/* social icon row */}
            <div className="mt-6 flex flex-wrap gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-cream/70 transition-all duration-200 hover:border-gold hover:bg-gold/10 hover:text-gold hover:scale-110"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Quick Links" links={quick} />
          <FooterCol title="Resources" links={resources} />

          <div>
            <h4 className="text-sm font-600 uppercase tracking-wider text-goldlite">Join Us</h4>
            <Link
              href="/register"
              className="mt-4 block rounded-full bg-gold px-5 py-2.5 text-center text-sm font-600 text-midnight hover:bg-goldlite transition"
            >
              Register Now ↗
            </Link>
            <a
              href="https://wa.me/917042719992"
              className="mt-3 block text-sm text-cream/70 hover:text-gold transition"
            >
              Join Channel for Updates
            </a>
          </div>
        </div>

        <p aria-hidden className="mt-14 select-none text-center font-display text-[18vw] font-900 leading-none text-white/[0.04]">
          NDGYS
        </p>
      </div>

      <div className="border-t border-[#D97706]/20">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-cream/50 sm:flex-row">
          <p>© 2026 New Delhi Global Youth Summit · All Rights Reserved</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-gold transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gold transition">Terms of Service</Link>
            <Link href="/refund" className="hover:text-gold transition">Refund Policy</Link>
          </div>
        </div>
      </div>

    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="text-sm font-600 uppercase tracking-wider text-[#F59E0B]">{title}</h4>
      <ul className="mt-4 space-y-2 text-sm text-cream/70">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-cream/70 hover:text-[#F59E0B] transition">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
