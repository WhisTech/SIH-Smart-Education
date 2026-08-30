import React from 'react';
import { 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ArrowUpRight, 
  TrendingUp, 
  Briefcase, 
  MapPin, 
  Calendar,
  Layers,
  FileUp,
  BrainCircuit,
  Bot,
  Zap,
  Activity
} from 'lucide-react';

export default function HeroBento({ 
  employee, 
  onOpenProfile, 
  onRunAssessment, 
  onUploadDoc, 
  onOpenCopilot, 
  onViewPathways,
  lang 
}) {
  const criticalGapsCount = Object.values(employee.assessedScores || {}).filter(score => score < 50).length;
  const moderateGapsCount = Object.values(employee.assessedScores || {}).filter(score => score >= 50 && score < 70).length;
  const proficientCount = Object.values(employee.assessedScores || {}).filter(score => score >= 70).length;

  const matchPercent = employee.overallCompetencyMatch || 71;
  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference - (matchPercent / 100) * circumference;

  return (
    <div className="w-full max-w-7xl mx-auto mb-8 space-y-4">
      
      {/* Top Dynamic Island Status Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="apple-badge badge-blue text-xs font-bold uppercase tracking-wider">
              {employee.department}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              Govt. of India • MoSPI
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)] mt-1">
            {lang === 'hi' ? 'नमस्ते' : 'Welcome back'}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0C447C] via-[#085041] to-[#BA7517]">{employee.name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 font-medium">
            {lang === 'hi'
              ? 'आधिकारिक सांख्यिकी प्रणाली के लिए आपकी व्यक्तिगत क्षमता और कौशल विकास डैशबोर्ड।'
              : 'Personalized competency gap radar & capacity building engine for India’s Official Statistics workforce.'}
          </p>
        </div>

        {/* Dynamic Island Session Pill */}
        <div className="dynamic-island px-4 py-2 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <div className="text-left">
            <p className="text-[11px] font-bold leading-tight">Live Competency Session</p>
            <p className="text-[9px] text-blue-200 font-mono">Synced with iGOT NLW 2026</p>
          </div>
          <button
            onClick={onRunAssessment}
            className="ml-1 px-3 py-1 rounded-full bg-white text-[#0C447C] text-[11px] font-extrabold hover:bg-amber-400 hover:text-black transition-all"
          >
            Diagnose
          </button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-4">
        
        {/* Bento Tile 1: Official Employee Identity Card (Span 5) */}
        <div className="lg:col-span-5 apple-glass-card p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-[#0C447C]/15 to-transparent rounded-bl-full pointer-events-none"></div>
          
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="relative group">
                  <img
                    src={employee.avatar}
                    alt={employee.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#0C447C]/40 dark:ring-white/20 shadow-md group-hover:scale-105 transition-all"
                  />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#639922] border-2 border-white dark:border-[#070B12] rounded-full shadow-sm"></span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--text-primary)] leading-tight">
                    {employee.name}
                  </h3>
                  <p className="text-xs font-bold text-[#0C447C] dark:text-blue-400 mt-0.5">
                    {employee.roleName}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                    {employee.empId} • {employee.service}
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenProfile}
                className="text-[11px] font-bold text-[#0C447C] dark:text-blue-400 hover:underline px-2.5 py-1 bg-white/70 dark:bg-white/10 rounded-xl border border-black/5 shadow-sm"
              >
                {lang === 'hi' ? 'संपादित करें' : 'Edit Profile'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Briefcase className="w-3.5 h-3.5 text-[#0C447C]" />
                <span className="truncate">{employee.department.split('(')[0]}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Calendar className="w-3.5 h-3.5 text-[#085041]" />
                <span>{employee.experience}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <MapPin className="w-3.5 h-3.5 text-[#BA7517]" />
                <span className="truncate">{employee.location.split(',')[0]}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Award className="w-3.5 h-3.5 text-[#639922]" />
                <span className="font-bold text-[var(--text-primary)]">SSS Cadre Batch 2024</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between bg-blue-50/80 dark:bg-blue-950/40 rounded-xl px-3.5 py-2 border border-blue-100 dark:border-blue-900/40">
            <span className="text-xs text-[var(--text-secondary)] font-semibold">
              Mandate: <strong className="text-[var(--text-primary)]">MoSPI Competency Framework v2.4</strong>
            </span>
            <span className="text-[11px] font-mono font-bold text-[#0C447C] dark:text-blue-400">17 Indicators</span>
          </div>
        </div>

        {/* Bento Tile 2: Overall Benchmark Progress Ring (Span 4) */}
        <div className="lg:col-span-4 apple-glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#0C447C]" />
              {lang === 'hi' ? 'समग्र दक्षता सूचकांक' : 'Competency Benchmark'}
            </span>
            <span className="apple-badge badge-teal text-[11px] font-bold">
              <TrendingUp className="w-3 h-3" />
              Role Benchmark: 75%
            </span>
          </div>

          <div className="flex items-center justify-center gap-6 my-2">
            {/* SVG Circular Ring */}
            <div className="relative flex items-center justify-center">
              <svg className="w-26 h-26 transform -rotate-90">
                <circle
                  cx="52"
                  cy="52"
                  r="44"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-200 dark:text-slate-800"
                  fill="transparent"
                />
                <circle
                  cx="52"
                  cy="52"
                  r="44"
                  stroke="url(#gradientScore)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out drop-shadow-md"
                />
                <defs>
                  <linearGradient id="gradientScore" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0C447C" />
                    <stop offset="50%" stopColor="#085041" />
                    <stop offset="100%" stopColor="#BA7517" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-[var(--text-primary)] tabular-nums">
                  {matchPercent}%
                </span>
                <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-extrabold">
                  Match
                </span>
              </div>
            </div>

            {/* Score Breakdown Pills */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#639922] shadow-sm"></span>
                <span className="text-[var(--text-secondary)] font-medium">{proficientCount} {lang === 'hi' ? 'कुशल' : 'Proficient'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#BA7517] shadow-sm"></span>
                <span className="text-[var(--text-secondary)] font-medium">{moderateGapsCount} {lang === 'hi' ? 'मध्यम अंतर' : 'Moderate'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A32D2D] shadow-sm"></span>
                <span className="text-[var(--text-secondary)] font-bold text-[#A32D2D]">{criticalGapsCount} {lang === 'hi' ? 'महत्वपूर्ण अंतर' : 'Critical Gaps'}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Next Cadre Benchmark:</span>
            <span className="font-bold text-[#085041] dark:text-emerald-400">82% (Senior Statistical Officer)</span>
          </div>
        </div>

        {/* Bento Tile 3: AI Critical Priority Flag (Span 3) */}
        <div className="lg:col-span-3 apple-glass-card p-5 flex flex-col justify-between bg-gradient-to-b from-white/95 to-amber-50/40 dark:from-[#0F172A] dark:to-[#1a2218]/40">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5 text-[#BA7517]" />
                {lang === 'hi' ? 'AI अंतर चेतावनी' : 'AI Flagged Focus'}
              </span>
              <span className="apple-badge badge-red text-[10px] py-0.5 px-2 font-bold">
                Priority 1
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-red-50/80 dark:bg-red-950/40 border border-red-200/70 dark:border-red-900/40">
                <p className="text-xs font-bold text-[#A32D2D] dark:text-red-400">
                  AI & Machine Learning (40%)
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Critical gap for automated NIC-2008 coding & survey intelligence.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/40">
                <p className="text-xs font-bold text-[#BA7517] dark:text-amber-400">
                  Big Data in Statistics (44%)
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Moderate gap in satellite luminosity analytics.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2">
            <button
              onClick={onViewPathways}
              className="w-full apple-btn-accent text-xs justify-center py-2.5 font-bold shadow-md"
            >
              <span>{lang === 'hi' ? 'iGOT पाठ्यक्रम देखें' : 'View Remedial Courses'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Quick-Jump Action Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        
        <button
          onClick={onRunAssessment}
          className="apple-glass p-3.5 rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-all text-left group shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-[#0C447C]/10 dark:bg-blue-500/20 flex items-center justify-center text-[#0C447C] dark:text-blue-400 group-hover:bg-[#0C447C] group-hover:text-white transition-all shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-[var(--text-primary)] leading-tight">
              {lang === 'hi' ? 'दक्षता रडार' : 'Skill Radar'}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">5 Domain Analysis</p>
          </div>
        </button>

        <button
          onClick={onUploadDoc}
          className="apple-glass p-3.5 rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-all text-left group shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-[#BA7517]/10 dark:bg-amber-500/20 flex items-center justify-center text-[#BA7517] group-hover:bg-[#BA7517] group-hover:text-white transition-all shadow-sm">
            <FileUp className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-[var(--text-primary)] leading-tight">
              {lang === 'hi' ? 'दस्तावेज़ से प्रश्नोत्तरी' : 'Doc-to-Quiz'}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">PDF / Text to MCQs</p>
          </div>
        </button>

        <button
          onClick={onViewPathways}
          className="apple-glass p-3.5 rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-all text-left group shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-[#085041]/10 dark:bg-emerald-500/20 flex items-center justify-center text-[#085041] dark:text-emerald-400 group-hover:bg-[#085041] group-hover:text-white transition-all shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-[var(--text-primary)] leading-tight">
              {lang === 'hi' ? 'iGOT और NSSTA' : 'iGOT / TPAC'}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">Curated Pathways</p>
          </div>
        </button>

        <button
          onClick={onOpenCopilot}
          className="apple-glass p-3.5 rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-all text-left group shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0C447C] to-[#085041] flex items-center justify-center text-white group-hover:scale-105 transition-all shadow-sm">
            <Bot className="w-4 h-4 text-[#BA7517]" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-[var(--text-primary)] leading-tight">
              {lang === 'hi' ? 'वॉइस कोपायलट' : 'Statistical Copilot'}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">Hindi & English Voice</p>
          </div>
        </button>

      </div>

    </div>
  );
}
