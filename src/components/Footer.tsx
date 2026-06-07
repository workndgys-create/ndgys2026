import Link from "next/link";

const quick = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/committees", label: "Committees" },
  { href: "/#contact", label: "Contact" }
];
const resources = [
  { href: "/venue", label: "Venue & Travel" },
  { href: "/schedule", label: "Schedule" },
  { href: "/#faq", label: "FAQs" },
  { href: "/dashboard", label: "Delegate Login" }
];
const socials = ["Instagram", "X", "YouTube", "LinkedIn"];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-cream">
      <div className="mx-auto max-w-6xl px-5 pt-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-2xl font-700">NDGYS<span className="text-gold">.</span></p>
            <p className="mt-3 max-w-xs text-sm text-cream/60">
              Empowering the next generation of global leaders through diplomacy and debate.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-cream/70">
              {socials.map((s) => {
                const href = s === "Instagram"
                  ? "https://www.instagram.com/globalyouthsummit.gys?igsh=N2c0NTJrMXRkd3Jn"
                  : s === "X"
                  ? "https://x.com/_ndgys"
                  : s === "LinkedIn"
                  ? "https://www.linkedin.com/company/new-delhi-global-youth-summit/"
                  : s === "YouTube"
                  ? "https://youtube.com/@socialhouselearning?si=sFIHsf2fZLKkBZMb"
                  : "#";
                const isExternal = s === "Instagram" || s === "X" || s === "LinkedIn" || s === "YouTube";
                return (
                  <a
                    key={s}
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="rounded-full border border-white/15 px-3 py-1 hover:border-gold hover:text-gold"
                  >
                    {s}
                  </a>
                );
              })}
            </div>
          </div>

          <FooterCol title="Quick Links" links={quick} />
          <FooterCol title="Resources" links={resources} />

          <div>
            <h4 className="text-sm font-600 uppercase tracking-wider text-goldlite">Join Us</h4>
            <Link href="/register" className="mt-4 block rounded-full bg-gold px-5 py-2.5 text-center text-sm font-600 text-midnight hover:bg-goldlite">
              Register Now ↗
            </Link>
            <a href="https://wa.me/919650058469" className="mt-3 block text-sm text-cream/70 hover:text-gold">
              Join Channel for Updates
            </a>
          </div>
        </div>

        <p aria-hidden className="mt-14 select-none text-center font-display text-[18vw] font-900 leading-none text-white/[0.04]">
          NDGYS
        </p>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-cream/50 sm:flex-row">
          <p>© 2026 New Delhi Global Youth Summit · All Rights Reserved</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-gold">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gold">Terms of Service</Link>
            <Link href="/refund" className="hover:text-gold">Refund Policy</Link>
            <Link href="/code-of-conduct" className="hover:text-gold">Code of Conduct</Link>
          </div>
        </div>
      </div>

      <a
        href="https://wa.me/919650058469"
        className="fixed bottom-5 right-5 z-40 rounded-full bg-green-500 px-5 py-3 text-sm font-600 text-white shadow-lg hover:bg-green-600"
      >
        Chat on WhatsApp
      </a>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="text-sm font-600 uppercase tracking-wider text-goldlite">{title}</h4>
      <ul className="mt-4 space-y-2 text-sm text-cream/70">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="hover:text-gold">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
