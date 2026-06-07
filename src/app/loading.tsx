export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/15 border-t-gold" />
        <p className="font-display text-sm tracking-wide text-slatey">Loading…</p>
      </div>
    </div>
  );
}
