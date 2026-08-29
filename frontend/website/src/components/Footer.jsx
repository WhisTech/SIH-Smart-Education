import React from 'react';
import { Building2, ShieldCheck, Award } from 'lucide-react';

export default function Footer({ lang }) {
  return (
    <footer className="w-full mt-16 py-8 border-t border-black/5 dark:border-white/10 apple-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-3">
          <Building2 className="w-4 h-4 text-[#0C447C] dark:text-blue-400" />
          <span>
            Ministry of Statistics & Programme Implementation (MoSPI) • Govt. of India
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span>Capacity Building Commission</span>
          <span>•</span>
          <span>iGOT Karmayogi Ecosystem</span>
          <span>•</span>
          <span className="font-bold text-[#BA7517]">SIH Problem Statement 26101</span>
        </div>
      </div>
    </footer>
  );
}
