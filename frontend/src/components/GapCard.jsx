import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/**
 * GapCard Component
 * Displays a priority skill gap with current score vs required benchmark and an action CTA.
 */
export default function GapCard({ 
  skillName, 
  assessedScore = 0, 
  requiredScore = 80, 
  gapPercentage = 0, 
  priority = 'High' 
}) {
  const { t } = useTranslation()
  const normPriority = (priority || 'Medium').toLowerCase()

  return (
    <div className={`gap-card gap-priority-${normPriority}`}>
      <div className="gap-card-top">
        <span className={`gap-priority-pill priority-${normPriority}`}>
          {priority === 'High' ? t('igot.high_priority_gap') : priority === 'Low' ? t('igot.low_priority_gap') : t('igot.medium_priority_gap')}
        </span>
        <span className="gap-diff-text">
          - {Math.round(gapPercentage)}% {t('result.gap') || 'Delta'}
        </span>
      </div>

      <h4 className="gap-skill-title">{skillName}</h4>

      <div className="gap-comparison-row">
        <div className="gap-metric">
          <span className="gap-metric-label">{t('result.current_level') || 'Current Score'}</span>
          <strong className="gap-metric-val current">{Math.round(assessedScore)}%</strong>
        </div>
        <div className="gap-arrow" aria-hidden="true">➔</div>
        <div className="gap-metric">
          <span className="gap-metric-label">{t('result.required_level') || 'Benchmark'}</span>
          <strong className="gap-metric-val target">{Math.round(requiredScore)}%</strong>
        </div>
      </div>

      <div className="gap-card-action">
        <Link to="/igot-courses" className="btn btn-outline btn-sm btn-block">
          {t('dashboard.go_to_courses') || 'View iGOT Modules ➔'}
        </Link>
      </div>
    </div>
  )
}
