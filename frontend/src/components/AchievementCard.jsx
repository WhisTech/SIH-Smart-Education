import React, { useState } from 'react'

/**
 * AchievementCard Component
 * Renders an official skill milestone badge with earned status indicator and unlock effects.
 */
export default function AchievementCard({ 
  icon = '🏆', 
  title = 'Achievement', 
  description = '', 
  earned = false 
}) {
  const [celebrating, setCelebrating] = useState(false)

  const handleBadgeClick = () => {
    if (earned) {
      setCelebrating(true)
      setTimeout(() => setCelebrating(false), 900)
    }
  }

  return (
    <div 
      className={`achievement-card ${earned ? 'earned badge-shimmer' : 'locked'} ${celebrating ? 'badge-pulse-celebration' : ''}`} 
      title={description}
      onClick={handleBadgeClick}
      role="button"
      tabIndex={0}
      style={{ cursor: earned ? 'pointer' : 'default' }}
    >
      <div className="achievement-icon-box" aria-hidden="true">
        <span className="achievement-icon">{icon}</span>
        {earned ? (
          <span className="achievement-status-badge earned" title="Earned">✓</span>
        ) : (
          <span className="achievement-status-badge locked" title="Locked">🔒</span>
        )}
      </div>

      <div className="achievement-body">
        <strong className="achievement-title">{title}</strong>
        <p className="achievement-desc">{description}</p>
        <span className={`achievement-chip ${earned ? 'earned' : 'locked'}`}>
          {earned ? '⭐ Unlocked' : 'In Progress'}
        </span>
      </div>

      {earned && <div className="badge-glimmer" />}
    </div>
  )
}
