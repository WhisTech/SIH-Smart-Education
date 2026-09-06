import React from 'react'

/**
 * LevelBadge Component
 * Displays the user's competency level with cadre title, animated indicator, and celebration trigger.
 */
export default function LevelBadge({ 
  level = 1, 
  title = 'Probationer', 
  badgeColor = '#1f4e79', 
  size = 'md',
  onClick
}) {
  return (
    <div 
      className={`level-badge level-badge-${size} ${onClick ? 'clickable-badge' : ''}`} 
      style={{ '--level-color': badgeColor }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={onClick ? "Click to view tier celebration" : undefined}
    >
      <div className="level-badge-number level-ring-glow">
        <span>LVL</span>
        <strong>{level}</strong>
      </div>
      <div className="level-badge-info">
        <span className="level-badge-label">Competency Tier</span>
        <span className="level-badge-title">{title}</span>
      </div>
    </div>
  )
}
