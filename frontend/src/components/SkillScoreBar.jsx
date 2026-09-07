import React from 'react'
import { useTranslation } from 'react-i18next'
import { useCountUp } from '../lib/useCountUp'

/**
 * SkillScoreBar Component
 * Displays a single skill's score with a visual gauge bar, status color, and benchmark indicator.
 */
export default function SkillScoreBar({ 
  skillName, 
  percentage = 0, 
  benchmark = 80, 
  questionsCount,
  correctCount 
}) {
  const { t } = useTranslation()
  const targetPct = Math.round(Number(percentage) || 0)
  const animatedPct = useCountUp(targetPct, 1000)
  
  // Status classification
  let statusClass = 'low'
  let statusText = t('reassessment.needs_improvement') || 'Needs Improvement'
  if (targetPct >= benchmark) {
    statusClass = 'high'
    statusText = t('reassessment.benchmark_met') || 'Benchmark Met'
  } else if (targetPct >= 60) {
    statusClass = 'medium'
    statusText = t('dashboard.moderate') || 'Developing'
  }

  return (
    <div className={`skill-score-bar-card status-${statusClass} animate-card`}>
      <div className="skill-score-header">
        <div className="skill-name-group">
          <strong className="skill-bar-name">{skillName}</strong>
          {questionsCount != null && (
            <span className="skill-questions-count">
              ({correctCount || 0}/{questionsCount} {t('result.correct') || 'correct'})
            </span>
          )}
        </div>
        <div className="skill-score-badge-group">
          <span className={`skill-status-tag tag-${statusClass}`}>{statusText}</span>
          <span className="skill-score-pct">{animatedPct}%</span>
        </div>
      </div>

      <div className="skill-progress-track">
        {/* Benchmark line marker */}
        {benchmark && (
          <div 
            className="benchmark-marker" 
            style={{ left: `${benchmark}%` }} 
            title={`Cadre Benchmark: ${benchmark}%`}
          >
            <span className="benchmark-line" />
            <span className="benchmark-tooltip">{benchmark}% {t('result.required') || 'Target'}</span>
          </div>
        )}
        <div 
          className={`skill-progress-fill fill-${statusClass} animated-fill`}
          style={{ width: `${Math.min(100, Math.max(0, animatedPct))}%` }}
        />
      </div>
    </div>
  )
}
