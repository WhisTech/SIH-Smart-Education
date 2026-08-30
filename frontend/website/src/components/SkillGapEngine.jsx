import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  TrendingDown, 
  Sparkles, 
  ArrowRight, 
  ExternalLink, 
  RotateCcw,
  Sliders,
  HelpCircle,
  ArrowLeft,
  Filter,
  BarChart2
} from 'lucide-react';
import { COMPETENCIES } from '../data/seedData';

export default function SkillGapEngine({ 
  employee, 
  setEmployee, 
  onNavigateToQuiz, 
  onNavigateToPathways,
  onBackToDashboard,
  lang 
}) {
  const [filterType, setFilterType] = useState('ALL');
  const [selectedCompForModal, setSelectedCompForModal] = useState(null);
  const [sliderValue, setSliderValue] = useState(70);

  const compListWithGaps = COMPETENCIES.map(comp => {
    const score = employee.assessedScores[comp.id] || 50;
    const requiredTarget = 75;
    const gap = score - requiredTarget;
    const isCritical = score < 50;
    const isModerate = score >= 50 && score < 70;

    return {
      ...comp,
      score,
      requiredTarget,
      gap,
      status: isCritical ? 'CRITICAL' : isModerate ? 'MODERATE' : 'MET'
    };
  });

  const filtered = compListWithGaps.filter(item => {
    if (filterType === 'ALL') return true;
    if (filterType === 'GAPS_ONLY') return item.status !== 'MET';
    if (filterType === 'CRITICAL') return item.status === 'CRITICAL';
    return item.type.toUpperCase() === filterType;
  });

  const handleUpdateScore = (compId, newScore) => {
    setEmployee(prev => {
      const updatedScores = {
        ...prev.assessedScores,
        [compId]: newScore
      };
      const total = Object.values(updatedScores).reduce((a, b) => a + b, 0);
      const newMatch = Math.round(total / Object.values(updatedScores).length);
      return {
        ...prev,
        assessedScores: updatedScores,
        overallCompetencyMatch: newMatch
      };
    });
    setSelectedCompForModal(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 apple-glass-card">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBackToDashboard}
            className="p-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-[#0C447C] hover:text-white transition-all shadow-sm group"
            title="Return to Master Dashboard"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="apple-badge badge-teal text-xs font-bold uppercase tracking-wider">
                {lang === 'hi' ? 'विशेषता 1' : 'Feature 1 (SIH 26101)'}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                Granular Skill-Gap Analysis & Benchmark Delta
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] mt-0.5">
              {lang === 'hi' ? 'कौशल अंतर मूल्यांकन और मैट्रिक्स' : 'Competency Skill-Gap Identification & Calibrator'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToQuiz}
            className="apple-btn-accent text-xs py-2 px-4 shadow-md font-bold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'दस्तावेज़ प्रश्नोत्तरी से परीक्षण करें' : 'Verify via AI Quiz'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap pb-1">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterType === 'ALL' ? 'bg-[#0C447C] text-white shadow-md' : 'bg-white/80 dark:bg-white/10 text-[var(--text-secondary)] hover:bg-white shadow-sm'
          }`}
        >
          All ({compListWithGaps.length})
        </button>
        <button
          onClick={() => setFilterType('GAPS_ONLY')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterType === 'GAPS_ONLY' ? 'bg-[#BA7517] text-white shadow-md' : 'bg-white/80 dark:bg-white/10 text-[var(--text-secondary)] hover:bg-white shadow-sm'
          }`}
        >
          Flagged Gaps ({compListWithGaps.filter(c => c.status !== 'MET').length})
        </button>
        <button
          onClick={() => setFilterType('CRITICAL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterType === 'CRITICAL' ? 'bg-[#A32D2D] text-white shadow-md' : 'bg-white/80 dark:bg-white/10 text-[var(--text-secondary)] hover:bg-white shadow-sm'
          }`}
        >
          Critical Priority ({compListWithGaps.filter(c => c.status === 'CRITICAL').length})
        </button>
        <button
          onClick={() => setFilterType('DOMAIN')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterType === 'DOMAIN' ? 'bg-[#085041] text-white shadow-md' : 'bg-white/80 dark:bg-white/10 text-[var(--text-secondary)] hover:bg-white shadow-sm'
          }`}
        >
          Domain
        </button>
        <button
          onClick={() => setFilterType('FUNCTIONAL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterType === 'FUNCTIONAL' ? 'bg-[#085041] text-white shadow-md' : 'bg-white/80 dark:bg-white/10 text-[var(--text-secondary)] hover:bg-white shadow-sm'
          }`}
        >
          Functional
        </button>
        <button
          onClick={() => setFilterType('BEHAVIOURAL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterType === 'BEHAVIOURAL' ? 'bg-[#085041] text-white shadow-md' : 'bg-white/80 dark:bg-white/10 text-[var(--text-secondary)] hover:bg-white shadow-sm'
          }`}
        >
          Behavioural
        </button>
      </div>

      {/* Competencies Gap Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(comp => {
          return (
            <div
              key={comp.id}
              className="apple-glass-card p-5 flex flex-col justify-between relative overflow-hidden group shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="apple-badge badge-blue text-[11px] font-mono font-bold">
                      {comp.id}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-semibold">
                      {comp.type}
                    </span>
                  </div>

                  <span
                    className={`apple-badge text-xs py-1 px-2.5 font-bold ${
                      comp.status === 'CRITICAL'
                        ? 'badge-red'
                        : comp.status === 'MODERATE'
                        ? 'badge-amber'
                        : 'badge-green'
                    }`}
                  >
                    {comp.status === 'CRITICAL' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-[#A32D2D]" />
                    ) : comp.status === 'MODERATE' ? (
                      <TrendingDown className="w-3.5 h-3.5 text-[#BA7517]" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#639922]" />
                    )}
                    {comp.gap < 0 ? `${Math.abs(comp.gap)}% Gap Detected` : 'Role Benchmark Met'}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
                  {comp.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                  {comp.desc}
                </p>

                {/* Score vs Target Progress */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)] font-medium">
                      Assessed Proficiency: <strong className="text-[var(--text-primary)]">{comp.score}%</strong>
                    </span>
                    <span className="text-[var(--text-muted)] font-mono font-bold">
                      Mandated Target: {comp.requiredTarget}%
                    </span>
                  </div>

                  <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${comp.score}%`,
                        backgroundColor: comp.status === 'CRITICAL' ? '#A32D2D' : comp.status === 'MODERATE' ? '#BA7517' : '#085041'
                      }}
                    ></div>
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-black dark:bg-white z-10"
                      style={{ left: `${comp.requiredTarget}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedCompForModal(comp);
                    setSliderValue(comp.score);
                  }}
                  className="text-xs font-bold text-[var(--text-secondary)] hover:text-[#0C447C] dark:hover:text-blue-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 transition-all"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Update Score</span>
                </button>

                {comp.status !== 'MET' ? (
                  <button
                    onClick={onNavigateToPathways}
                    className="apple-btn-primary text-xs py-1.5 px-3.5 font-bold shadow-sm"
                  >
                    <span>View Recommended iGOT Course</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-[#639922] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Role Requirement Satisfied
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Score Calibrator Modal */}
      {selectedCompForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="apple-glass-card max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="apple-badge badge-blue text-xs font-mono font-bold">
                  {selectedCompForModal.id}
                </span>
                <h3 className="text-base font-extrabold text-[var(--text-primary)] mt-1">
                  {selectedCompForModal.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCompForModal(null)}
                className="p-1.5 rounded-xl hover:bg-black/5 text-[var(--text-muted)] font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-5 leading-relaxed">
              Adjust official self-assessment or diagnostic score based on recent NSSTA workshop or field verification for <strong>{employee.name}</strong>:
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between text-sm font-extrabold">
                <span>Calibrated Score:</span>
                <span className="text-2xl text-[#0C447C] dark:text-blue-400 font-mono">{sliderValue}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-full accent-[#0C447C] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[var(--text-muted)] font-semibold">
                <span>20% (Novice)</span>
                <span>75% (Target)</span>
                <span>100% (Mastery)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedCompForModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateScore(selectedCompForModal.id, sliderValue)}
                className="apple-btn-primary text-xs py-2 px-4 shadow-md"
              >
                Save & Recalibrate Radar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
