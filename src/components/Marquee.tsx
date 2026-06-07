const ITEM = "NEW DELHI GLOBAL YOUTH SUMMIT 2026 · INAUGURAL EDITION · NEW DELHI, INDIA · REGISTRATIONS OPEN ·";
export default function Marquee() {
  return (
<<<<<<< HEAD
    <div className="bg-midnight text-goldlite overflow-hidden border-b border-white/10">
      <div className="flex whitespace-nowrap animate-marquee py-2 text-[11px] tracking-[0.25em] font-medium">
=======
    <div className="fixed top-0 left-0 right-0 z-[60] h-8 bg-midnight text-goldlite overflow-hidden border-b border-white/10">
      <div className="flex whitespace-nowrap animate-marquee h-full items-center text-[11px] tracking-[0.25em] font-medium">
>>>>>>> c44805af881fec0d8e0261bab301efbefe737c1f
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="mx-6">{ITEM}</span>
        ))}
      </div>
    </div>
  );
}
