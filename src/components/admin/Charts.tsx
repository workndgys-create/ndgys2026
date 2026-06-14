"use client";

/** Minimal, dependency-free SVG charts tuned to the editorial palette. */

const NAVY = "#1A1A3E";
const GOLD = "#C9A24B";
const GOLDLITE = "#E4C97E";
const SLATE = "#6B6E8A";

export function LineSeries({ data }: { data: { date: string; count: number }[] }) {
  const w = 560, h = 200, pad = 28;
  const max = Math.max(1, ...data.map((d) => d.count));
  const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const x = (i: number) => pad + i * step;
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const pts = data.map((d, i) => `${x(i)},${y(d.count)}`).join(" ");
  const area = `${pad},${h - pad} ${pts} ${x(data.length - 1)},${h - pad}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Registrations over the last 14 days">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.28" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((g) => (
        <line key={g} x1={pad} x2={w - pad} y1={y(max * g)} y2={y(max * g)} stroke={SLATE} strokeOpacity="0.15" />
      ))}
      <polygon points={area} fill="url(#lg)" />
      <polyline points={pts} fill="none" stroke={NAVY} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.count)} r="3" fill={GOLD} />
      ))}
      {data.map((d, i) =>
        i % 2 === 0 ? (
          <text key={i} x={x(i)} y={h - 8} textAnchor="middle" fontSize="9" fill={SLATE}>{d.date}</text>
        ) : null
      )}
    </svg>
  );
}

export function CapacityBars({ data }: { data: { name: string; paid: number; capacity: number }[] }) {
  return (
    <div className="space-y-3">
      {data.map((t) => {
        const pct = t.capacity ? Math.min(100, Math.round((t.paid / t.capacity) * 100)) : 0;
        return (
          <div key={t.name}>
            <div className="flex items-center justify-between gap-2 text-xs min-w-0">
              <span className="truncate text-ink/80 min-w-0">{t.name}</span>
              <span className="tabular-nums text-slatey">{t.paid}/{t.capacity}</span>
            </div>
            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: pct >= 100 ? NAVY : GOLD }}
              />
            </div>
          </div>
        );
      })}
      {data.length === 0 && <p className="text-sm text-slatey">No tracks yet.</p>}
    </div>
  );
}

export function Donut({ beginner, experienced }: { beginner: number; experienced: number }) {
  const total = beginner + experienced;
  const r = 52, c = 2 * Math.PI * r;
  const begFrac = total ? beginner / total : 0;
  const begLen = c * begFrac;

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="h-32 w-32 -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke={GOLDLITE} strokeWidth="18" />
        <circle
          cx="70" cy="70" r={r} fill="none" stroke={NAVY} strokeWidth="18"
          strokeDasharray={`${begLen} ${c - begLen}`} strokeLinecap="butt"
        />
      </svg>
      <div className="space-y-2 text-sm">
        <Legend color={NAVY} label="Beginner" value={beginner} />
        <Legend color={GOLDLITE} label="Experienced" value={experienced} />
        {total === 0 && <p className="text-slatey">No data yet.</p>}
      </div>
    </div>
  );
}

const Legend = ({ color, label, value }: { color: string; label: string; value: number }) => (
  <div className="flex items-center gap-2">
    <span className="inline-block h-3 w-3 rounded-sm" style={{ background: color }} />
    <span className="text-ink/80">{label}</span>
    <span className="ml-auto font-600 tabular-nums">{value}</span>
  </div>
);
