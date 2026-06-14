"use client";

type RegItem = {
  id: string;
  delegateId: string;
  fullName: string;
  trackSlug: string;
  trackName: string;
  isCompetition: boolean;
};

interface Props {
  currentId: string;
  registrations: RegItem[];
}

export default function OverviewRegistrations({ currentId, registrations }: Props) {
  if (registrations.length <= 1) return null;

  const handleSwitch = (id: string) => {
    document.cookie = `ndgys_active_reg_id=${id}; path=/; max-age=604800; SameSite=Lax`;
    window.location.reload();
  };

  return (
    <div className="mt-6 rounded-2xl border border-gold/20 bg-goldlite/5 p-5">
      <p className="text-xs font-600 uppercase tracking-widest text-gold">Your Registered Events</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {registrations.map((r) => {
          const isActive = r.id === currentId;
          return (
            <button
              key={r.id}
              onClick={() => !isActive && handleSwitch(r.id)}
              disabled={isActive}
              className={`flex flex-col text-left rounded-xl border p-4 transition-all w-full ${
                isActive
                  ? "border-gold bg-gold/10 cursor-default"
                  : "border-ink/10 bg-paper hover:border-gold/40 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-display font-700 text-ink">
                  {r.isCompetition ? "🏆" : "🏛️"} {r.trackName}
                </span>
                {isActive && (
                  <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[9px] font-700 text-ink uppercase tracking-wider">
                    Viewing
                  </span>
                )}
              </div>
              <span className="mt-1 font-mono text-xs text-slatey">ID: {r.delegateId}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
