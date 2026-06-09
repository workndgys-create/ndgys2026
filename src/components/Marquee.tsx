const ITEM = "NEW DELHI GLOBAL YOUTH SUMMIT 4.0 · INAUGURAL EDITION · NEW DELHI, INDIA · REGISTRATIONS OPEN ·";
export default function Marquee() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-8 bg-[#3B1A0A] text-[#F59E0B] overflow-hidden border-b border-[#D97706]/30">
      <div className="flex whitespace-nowrap animate-marquee h-full items-center text-[11px] tracking-[0.25em] font-medium">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="mx-6">{ITEM}</span>
        ))}
      </div>
    </div>
  );
}
