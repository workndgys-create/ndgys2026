"use client";

import { useState } from "react";

type RegItem = {
  id: string;
  delegateId: string;
  fullName: string;
  trackSlug: string;
  trackName: string;
  isCompetition: boolean;
};

interface SwitcherProps {
  currentId: string;
  registrations: RegItem[];
}

export default function RegistrationSwitcher({ currentId, registrations }: SwitcherProps) {
  const [activeId, setActiveId] = useState(currentId);

  if (registrations.length <= 1) return null;

  const handleSwitch = (val: string) => {
    setActiveId(val);
    document.cookie = `ndgys_active_reg_id=${val}; path=/; max-age=604800; SameSite=Lax`;
    window.location.reload();
  };

  return (
    <div className="mb-4 rounded-xl border border-ink/10 bg-paper p-3 shadow-sm transition-all hover:border-gold/30">
      <label className="block text-[10px] font-600 uppercase tracking-widest text-slatey">
        Active Registration
      </label>
      <div className="relative mt-1">
        <select
          value={activeId}
          onChange={(e) => handleSwitch(e.target.value)}
          className="w-full cursor-pointer appearance-none bg-transparent pr-8 font-display text-sm font-700 text-ink outline-none"
        >
          {registrations.map((r) => (
            <option key={r.id} value={r.id} className="bg-paper text-ink">
              {r.isCompetition ? "🏆" : "🏛️"} {r.trackName} ({r.delegateId})
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1 text-slatey">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
