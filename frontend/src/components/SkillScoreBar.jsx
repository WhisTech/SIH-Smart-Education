import React from 'react'
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
  const targetPct = Math.round(Number(percentage) || 0)
  const animatedPct = useCountUp(targetPct, 1000)
  
  // Status classification
  let statusClass = 'low'
  let statusText = 'Needs Improvement'
  if (targetPct >= benchmark) {
    statusClass = 'high'
    statusText = 'Benchmark Met'
  } else if (targetPct >= 60) {
    statusClass = 'medium'
    statusText = 'Developing'
  }

  return (
    <div className={`skill-score-bar-card status-${statusClass} animate-card`}>
      <div className="skill-score-header">
        <div className="skill-name-group">
          <strong className="skill-bar-name">{skillName}</strong>
          {questionsCount != null && (
            <span className="skill-questions-count">
              ({correctCount || 0}/{questionsCount} correct)
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
            <span className="benchmark-tooltip">{benchmark}% Target</span>
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
