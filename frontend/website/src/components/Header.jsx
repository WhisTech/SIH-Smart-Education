import React from 'react';
import { 
  Building2, 
  Sparkles, 
  Globe2, 
  Moon, 
  Sun, 
  UserCheck, 
  GraduationCap, 
  Radar, 
  FileText, 
  BookOpen, 
  Bot, 
  Zap
} from 'lucide-react';
import { OFFICIAL_ROLES } from '../data/seedData';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  employee, 
  setEmployee, 
  darkMode, 
  setDarkMode, 
  lang, 
  setLang,
  onOpenProfile
}) {
  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-8 py-3 apple-glass border-b border-white/30 dark:border-white/10 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3.5">
        
        {/* Left Branding: MoSPI + iGOT Karmayogi Dual Emblem */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0C447C] via-[#085041] to-[#BA7517] p-0.5 shadow-md flex items-center justify-center text-white shrink-0">
            <div className="w-full h-full bg-[#0C447C] dark:bg-[#070B12] rounded-[14px] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#BA7517]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-[var(--text-primary)]">
                MoSPI <span className="text-[#0C447C] dark:text-[#60A5FA]">AI-Karmayogi</span>
              </span>
              <span className="apple-badge badge-amber text-[10px] py-0.5 px-2 font-bold uppercase tracking-wider">
                SIH 26101
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">
              National Statistical Capacity & Competency Platform
            </p>
          </div>
        </div>

        {/* Center: Apple-style Navigation Pill Bar */}
        <nav className="flex items-center gap-1.5 p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl backdrop-blur-xl border border-white/20 dark:border-white/10 overflow-x-auto max-w-full shadow-inner">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-blue-600 text-[#0C447C] dark:text-white shadow-md scale-[1.02]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/40 dark:hover:bg-white/10'
            }`}
          >
            <Radar className="w-3.5 h-3.5 text-[#0C447C] dark:text-blue-200" />
            <span>{lang === 'hi' ? 'दक्षता रडार' : 'Competency Radar'}</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'matrix'
                ? 'bg-white dark:bg-blue-600 text-[#0C447C] dark:text-white shadow-md scale-[1.02]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/40 dark:hover:bg-white/10'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-[#085041] dark:text-emerald-300" />
            <span>{lang === 'hi' ? 'कौशल मैट्रिक्स' : 'Skill Matrix'}</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'quiz'
                ? 'bg-white dark:bg-blue-600 text-[#0C447C] dark:text-white shadow-md scale-[1.02]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/40 dark:hover:bg-white/10'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#BA7517]" />
            <span className="flex items-center gap-1">
              {lang === 'hi' ? 'दस्तावेज़ प्रश्नोत्तरी' : 'AI Doc-to-Quiz'}
              <span className="w-1.5 h-1.5 rounded-full bg-[#BA7517] animate-ping"></span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pathways')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'pathways'
                ? 'bg-white dark:bg-blue-600 text-[#0C447C] dark:text-white shadow-md scale-[1.02]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/40 dark:hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#639922]" />
            <span>{lang === 'hi' ? 'iGOT पाठ्यक्रम' : 'iGOT & TPAC Courses'}</span>
          </button>

          <button
            onClick={() => setActiveTab('copilot')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'copilot'
                ? 'bg-gradient-to-r from-[#0C447C] to-[#085041] text-white shadow-md scale-[1.02]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/40 dark:hover:bg-white/10'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-[#BA7517]" />
            <span>{lang === 'hi' ? 'सांख्यिकी सहायक' : 'Voice Copilot'}</span>
          </button>
        </nav>

        {/* Right Controls: Role Persona Switcher, Lang, Theme & Profile */}
        <div className="flex items-center gap-2">
          
          {/* Quick Role Persona Switcher */}
          <div className="flex items-center gap-1.5 bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-primary)] shadow-sm">
            <UserCheck className="w-3.5 h-3.5 text-[#085041] shrink-0" />
            <select
              value={employee.roleId}
              onChange={(e) => {
                const r = OFFICIAL_ROLES.find(item => item.id === e.target.value);
                if (r) {
                  setEmployee(prev => ({
                    ...prev,
                    roleId: r.id,
                    roleName: r.name,
                    service: r.service,
                    department: r.dept,
                    overallCompetencyMatch: Math.min(96, Math.max(52, r.benchmarkScore - 4))
                  }));
                }
              }}
              className="bg-transparent border-none outline-none text-xs font-semibold cursor-pointer max-w-[130px] truncate"
            >
              {OFFICIAL_ROLES.map(r => (
                <option key={r.id} value={r.id} className="dark:bg-[#070B12] text-slate-900 dark:text-slate-100">
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
            className="px-2 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10 text-xs font-extrabold text-[var(--text-primary)] hover:bg-white transition-all flex items-center gap-1 shadow-sm"
            title="Toggle Language (English / हिन्दी)"
          >
            <Globe2 className="w-3.5 h-3.5 text-[#0C447C] dark:text-[#60A5FA]" />
            <span>{lang === 'en' ? 'हिन्दी' : 'EN'}</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={() => setDarkMode(d => !d)}
            className="p-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10 text-[var(--text-primary)] hover:bg-white dark:hover:bg-white/20 transition-all shadow-sm"
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
          </button>

          {/* Official Profile Badge (Aditya Jadhav) */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-[#0C447C]/10 dark:bg-blue-500/20 border border-[#0C447C]/30 hover:border-[#0C447C] transition-all text-left shadow-sm group"
          >
            <img 
              src={employee.avatar} 
              alt={employee.name} 
              className="w-7 h-7 rounded-full object-cover ring-2 ring-[#0C447C] group-hover:scale-105 transition-all" 
            />
            <div className="hidden sm:block">
              <p className="text-[11px] font-bold text-[var(--text-primary)] leading-tight">{employee.name.split(' ')[0]}</p>
              <p className="text-[9px] text-[var(--text-muted)] font-mono font-bold">{employee.empId.split('-')[1]}</p>
            </div>
          </button>
        </div>

      </div>
    </header>
  );
}
