import React, { useState } from 'react';
import { 
  BookOpen, 
  Calendar, 
  ExternalLink, 
  Clock, 
  MapPin, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Bot, 
  Briefcase,
  ArrowLeft,
  Star
} from 'lucide-react';
import { IGOT_COURSES, NSSTA_TPAC_PROGRAMMES } from '../data/seedData';

export default function Recommendations({ employee, onBackToDashboard, lang }) {
  const [activeTab, setActiveTab] = useState('IGOT');
  const [enrolledIds, setEnrolledIds] = useState(['IGOT_013']);

  const toggleEnrol = (id) => {
    setEnrolledIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Top Navigation Banner */}
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
              <span className="apple-badge badge-blue text-xs font-bold uppercase tracking-wider">
                {lang === 'hi' ? 'प्रशिक्षण सिफारिशें' : 'Capacity Building Hub'}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                iGOT Karmayogi & NSSTA TPAC Integrated
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] mt-0.5">
              {lang === 'hi' ? 'व्यक्तिगत शिक्षण मार्ग' : 'Personalized Learning Pathways & Courses'}
            </h1>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5">
          <button
            onClick={() => setActiveTab('IGOT')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'IGOT'
                ? 'bg-white dark:bg-blue-600 text-[#0C447C] dark:text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>iGOT Karmayogi ({IGOT_COURSES.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('TPAC')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'TPAC'
                ? 'bg-white dark:bg-blue-600 text-[#0C447C] dark:text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>NSSTA / TPAC ({NSSTA_TPAC_PROGRAMMES.length})</span>
          </button>
        </div>
      </div>

      {/* iGOT Karmayogi Courses View */}
      {activeTab === 'IGOT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {IGOT_COURSES.map(course => {
            const isEnrolled = enrolledIds.includes(course.courseId);
            const userScore = employee.assessedScores[course.competencyTag] || 50;
            const isHighPriority = userScore < 50;

            return (
              <div
                key={course.courseId}
                className={`apple-glass-card p-5 flex flex-col justify-between relative overflow-hidden shadow-md ${
                  isHighPriority ? 'border-amber-400/40 bg-amber-50/15 dark:bg-amber-950/20' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="apple-badge badge-blue text-[10px] font-mono font-bold">
                      {course.courseId}
                    </span>
                    {isHighPriority && (
                      <span className="apple-badge badge-red text-[10px] py-0.5 px-2 font-bold">
                        Priority Gap Remedy
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] leading-snug">
                    {course.title}
                  </h3>

                  <p className="text-xs text-[var(--text-secondary)] mt-1.5 flex items-center justify-between">
                    <span className="font-bold text-[#085041] dark:text-emerald-400">{course.provider}</span>
                    <span className="flex items-center gap-1 font-bold text-amber-500 text-[11px]">
                      <Star className="w-3 h-3 fill-current" />
                      {course.rating}
                    </span>
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-black/5 dark:border-white/10 text-[11px] text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <span>{course.level}</span>
                    </div>
                  </div>

                  <div className="mt-3 p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-[11px] text-[var(--text-secondary)]">
                    Target Competency: <strong className="text-[var(--text-primary)]">{course.competencyName}</strong>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2">
                  <a
                    href={course.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#0C447C] dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Launch on iGOT</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => toggleEnrol(course.courseId)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-sm ${
                      isEnrolled
                        ? 'bg-[#639922] text-white'
                        : 'apple-btn-primary py-1.5'
                    }`}
                  >
                    {isEnrolled ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Enrolled
                      </span>
                    ) : (
                      'Start Module'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NSSTA TPAC Training Schedule View */}
      {activeTab === 'TPAC' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NSSTA_TPAC_PROGRAMMES.map(prog => {
            return (
              <div
                key={prog.progId}
                className="apple-glass-card p-5 flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="apple-badge badge-teal text-[10px] font-mono font-bold">
                      {prog.progId} • {prog.calendarYear}
                    </span>
                    <span className="apple-badge badge-amber text-[10px] py-0.5 px-2 font-bold">
                      {prog.status}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] leading-snug">
                    {prog.name}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 mt-4 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0C447C]" />
                      <span className="truncate">{prog.institute}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <span>{prog.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <span>Batch: {prog.batchSize} Officers</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <span className="truncate">{prog.targetAudience}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)] font-medium">Sponsored by NSSTA</span>
                  <a
                    href="https://nssta.gov.in"
                    target="_blank"
                    rel="noreferrer"
                    className="apple-btn-teal text-xs py-1.5 px-3.5 font-bold"
                  >
                    <span>Request Nomination</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
