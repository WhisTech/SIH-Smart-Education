import React, { useState } from 'react';
import { 
  Radar as RadarIcon, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { COMPETENCY_CATEGORIES, COMPETENCIES } from '../data/seedData';

export default function CompetencyRadar({ employee, onRunAssessment, onNavigateToPathways, lang }) {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Compute average scores per category
  const categoryScores = COMPETENCY_CATEGORIES.map(cat => {
    const comps = COMPETENCIES.filter(c => c.categoryId === cat.id);
    const totalScore = comps.reduce((sum, c) => sum + (employee.assessedScores[c.id] || 50), 0);
    const avgScore = Math.round(totalScore / (comps.length || 1));
    const targetBenchmark = 75; // Baseline benchmark for MoSPI roles
    const gap = avgScore - targetBenchmark;
    return {
      ...cat,
      avgScore,
      targetBenchmark,
      gap,
      compsCount: comps.length
    };
  });

  // 5-axis Radar SVG parameters
  const size = 320;
  const center = size / 2;
  const radius = 105;
  const numAxes = categoryScores.length;

  const getCoordinates = (index, value) => {
    const angle = (Math.PI * 2 / numAxes) * index - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  const currentPoints = categoryScores.map((cat, i) => {
    const { x, y } = getCoordinates(i, cat.avgScore);
    return `${x},${y}`;
  }).join(' ');

  const benchmarkPoints = categoryScores.map((cat, i) => {
    const { x, y } = getCoordinates(i, cat.targetBenchmark);
    return `${x},${y}`;
  }).join(' ');

  const filteredCompetencies = activeCategory === 'ALL'
    ? COMPETENCIES
    : COMPETENCIES.filter(c => c.categoryId === activeCategory);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="apple-badge badge-blue text-xs font-bold">
              {lang === 'hi' ? 'विशेषता 1' : 'Feature 1'}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              Role-Based Competency Radar
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] mt-1">
            {lang === 'hi' ? 'दक्षता रडार और कौशल अंतर इंजन' : 'Role-Based Competency Radar & Skill-Gap Engine'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            {lang === 'hi'
              ? 'आपके पद के अनुसार 5 प्रमुख कार्यक्षेत्रों में अपेक्षित बनाम वर्तमान दक्षता का वास्तविक समय विश्लेषण।'
              : 'Dynamic multi-axis competency graph comparing official baseline benchmarks with live assessed capabilities.'}
          </p>
        </div>

        <button
          onClick={onRunAssessment}
          className="apple-btn-accent text-xs font-semibold py-2 px-4 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'दक्षता स्व-मूल्यांकन शुरू करें' : 'Recalibrate Skill Scores'}</span>
        </button>
      </div>

      {/* Main Radar & Domain Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: SVG Polar Radar Chart (Span 6) */}
        <div className="lg:col-span-6 apple-glass-card p-6 flex flex-col items-center justify-between relative overflow-hidden">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <RadarIcon className="w-4 h-4 text-[#0C447C] dark:text-blue-400" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {lang === 'hi' ? '5-आयामी दक्षता रडार ग्राफ' : '5-Axis Competency Radar Graph'}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-full bg-[#0C447C] dark:bg-blue-400"></span>
                <span className="text-[var(--text-secondary)] text-[11px]">Current Score</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-[#BA7517]"></span>
                <span className="text-[var(--text-secondary)] text-[11px]">Benchmark (75%)</span>
              </div>
            </div>
          </div>

          {/* SVG Interactive Radar Canvas */}
          <div className="relative my-3 flex items-center justify-center">
            <svg width={size} height={size} className="overflow-visible">
              
              {/* Background Concentric Radar Rings */}
              {[20, 40, 60, 80, 100].map((level) => {
                const ringPoints = categoryScores.map((_, i) => {
                  const { x, y } = getCoordinates(i, level);
                  return `${x},${y}`;
                }).join(' ');
                return (
                  <polygon
                    key={level}
                    points={ringPoints}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-slate-300/60 dark:text-slate-700/60"
                    strokeDasharray={level === 80 ? '3,3' : 'none'}
                  />
                );
              })}

              {/* Axis lines */}
              {categoryScores.map((cat, i) => {
                const { x, y } = getCoordinates(i, 100);
                return (
                  <line
                    key={cat.id}
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-slate-300/60 dark:text-slate-700/60"
                  />
                );
              })}

              {/* Benchmark Dotted Polygon */}
              <polygon
                points={benchmarkPoints}
                fill="rgba(186, 117, 23, 0.06)"
                stroke="#BA7517"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />

              {/* Current Score Polygon */}
              <polygon
                points={currentPoints}
                fill="rgba(12, 68, 124, 0.28)"
                stroke="#0C447C"
                strokeWidth="2.5"
                className="transition-all duration-700 ease-out drop-shadow-md"
              />

              {/* Vertex Nodes & Hover Markers */}
              {categoryScores.map((cat, i) => {
                const { x, y } = getCoordinates(i, cat.avgScore);
                const isHovered = hoveredPoint === cat.id;
                return (
                  <g key={cat.id} className="cursor-pointer" onMouseEnter={() => setHoveredPoint(cat.id)} onMouseLeave={() => setHoveredPoint(null)}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 7 : 5}
                      fill="#0C447C"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      className="transition-all duration-200"
                    />
                  </g>
                );
              })}

              {/* Axis Labels */}
              {categoryScores.map((cat, i) => {
                const angle = (Math.PI * 2 / numAxes) * i - Math.PI / 2;
                const labelRadius = radius + 30;
                const lx = center + labelRadius * Math.cos(angle);
                const ly = center + labelRadius * Math.sin(angle);
                return (
                  <text
                    key={cat.id}
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[10px] font-bold fill-slate-700 dark:fill-slate-300 cursor-pointer select-none"
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.name.split(' ')[0]} ({cat.avgScore}%)
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="w-full flex items-center justify-between text-xs pt-3 border-t border-black/5 dark:border-white/10">
            <span className="text-[var(--text-secondary)]">Click any domain on the right to drill down.</span>
          </div>
        </div>

        {/* Right: 5 Domain Scorecards (Span 6) */}
        <div className="lg:col-span-6 space-y-3">
          {categoryScores.map((cat) => {
            const isCritical = cat.avgScore < 50;
            const isModerate = cat.avgScore >= 50 && cat.avgScore < 70;

            return (
              <div
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? 'ALL' : cat.id)}
                className={`apple-glass p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
                  activeCategory === cat.id ? 'ring-2 ring-[#0C447C] bg-white/95 dark:bg-white/10' : 'hover:bg-white/70 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: isCritical ? '#A32D2D' : isModerate ? '#BA7517' : '#639922' }}
                    ></div>
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                      {cat.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                      {cat.avgScore}% / 100%
                    </span>
                    <span
                      className={`apple-badge text-[10px] py-0.5 px-2 ${
                        isCritical ? 'badge-red' : isModerate ? 'badge-amber' : 'badge-green'
                      }`}
                    >
                      {isCritical ? 'Critical Gap' : isModerate ? 'Needs Training' : 'Proficient'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar with Benchmark Marker */}
                <div className="relative w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden my-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.avgScore}%`,
                      backgroundColor: isCritical ? '#A32D2D' : isModerate ? '#BA7517' : '#085041'
                    }}
                  ></div>
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-[#0C447C] z-10"
                    style={{ left: '75%' }}
                    title="Benchmark Target: 75%"
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] mt-1">
                  <span>{cat.compsCount} Indicators</span>
                  <span className="text-right">
                    {cat.gap < 0 ? (
                      <strong className="text-[#A32D2D]">{Math.abs(cat.gap)}% below benchmark</strong>
                    ) : (
                      <strong className="text-[#639922]">+{cat.gap}% met</strong>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Detailed Competency Breakdown Grid */}
      <div className="apple-glass-card p-6 mt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <Filter className="w-4 h-4 text-[#0C447C] dark:text-blue-400" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {lang === 'hi' ? 'विस्तृत योग्यता विश्लेषण' : 'Granular Competency Breakdown'} ({filteredCompetencies.length} Indicators)
            </h3>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === 'ALL' ? 'bg-[#0C447C] text-white' : 'bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] hover:bg-black/10'
              }`}
            >
              All Domains
            </button>
            {COMPETENCY_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  activeCategory === cat.id ? 'bg-[#0C447C] text-white' : 'bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] hover:bg-black/10'
                }`}
              >
                {cat.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompetencies.map(comp => {
            const score = employee.assessedScores[comp.id] || 50;
            const target = 75;
            const isGap = score < target;
            const isCritical = score < 50;

            return (
              <div
                key={comp.id}
                className="apple-glass p-4 rounded-2xl flex flex-col justify-between hover:border-[#0C447C]/40 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="apple-badge badge-blue text-[10px] font-mono">{comp.id}</span>
                    <span
                      className={`apple-badge text-[10px] py-0.5 px-2 ${
                        isCritical ? 'badge-red' : isGap ? 'badge-amber' : 'badge-green'
                      }`}
                    >
                      {score}% ({isCritical ? 'Critical' : isGap ? 'Gap' : 'Met'})
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)] mt-1.5 leading-snug">
                    {comp.name}
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2">
                    {comp.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-muted)] font-medium">Type: {comp.type}</span>
                  {isGap && (
                    <button
                      onClick={onNavigateToPathways}
                      className="text-[#0C447C] dark:text-blue-400 font-bold flex items-center gap-1 hover:underline"
                    >
                      <span>Find iGOT Course</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
