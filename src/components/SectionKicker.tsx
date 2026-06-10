export default function SectionKicker({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 text-gold sm:justify-start">
      <span className="hidden h-px w-8 bg-gold/70 sm:block" />
      <span className="kicker text-[11px] font-semibold uppercase">{label}</span>
    </div>
  );
}
