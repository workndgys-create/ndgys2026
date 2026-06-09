export default function SectionKicker({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-gold">
      <span className="h-px w-8 bg-gold/70" />
      <span className="kicker text-[11px] font-semibold uppercase">{label}</span>
    </div>
  );
}
