const ITEM = "NEW DELHI GLOBAL YOUTH SUMMIT 2026 · INAUGURAL EDITION · NEW DELHI, INDIA · REGISTRATIONS OPEN ·";
export default function Marquee() {
  return (
    <div className="bg-midnight text-goldlite overflow-hidden border-b border-white/10">
      <div className="flex whitespace-nowrap animate-marquee py-2 text-[11px] tracking-[0.25em] font-medium">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="mx-6">{ITEM}</span>
        ))}
      </div>
    </div>
  );
}
