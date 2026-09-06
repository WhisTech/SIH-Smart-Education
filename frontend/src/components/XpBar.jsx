import React from 'react'
import { useCountUp } from '../lib/useCountUp'

/**
 * XpBar Component
 * Renders an animated XP progress bar with current progress, level targets, and remaining XP.
 */
export default function XpBar({ 
  currentXp = 0, 
  minXp = 0, 
  maxXp = 500, 
  progressPercent = 0, 
  xpNeededForNext = 0,
  isMaxLevel = false,
  compact = false 
}) {
  const animatedXp = useCountUp(currentXp, 1200)
  const animatedPct = useCountUp(progressPercent, 1000)

  return (
    <div className={`xp-bar-container ${compact ? 'compact' : ''}`}>
      <div className="xp-bar-header">
        <div className="xp-bar-title">
          <span className="xp-sparkle animated-pulse">✨</span>
          <span className="xp-label">Experience Points</span>
          <strong className="xp-current-value">{animatedXp.toLocaleString()} XP</strong>
        </div>
        <div className="xp-bar-target">
          {isMaxLevel ? (
            <span className="xp-max-tag">Max Tier Reached</span>
          ) : (
            <span className="xp-remaining-text">
              <strong>{xpNeededForNext.toLocaleString()} XP</strong> to next tier
            </span>
          )}
        </div>
      </div>

      <div className="xp-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
        <div 
          className="xp-fill xp-shimmer" 
          style={{ width: `${Math.min(100, Math.max(0, animatedPct))}%` }}
        >
          <div className="xp-shimmer-light" />
        </div>
      </div>

      {!compact && (
        <div className="xp-bar-footer">
          <span className="xp-tier-min">{minXp.toLocaleString()} XP</span>
          <span className="xp-tier-pct">{animatedPct}% Tier Mastery</span>
          <span className="xp-tier-max">{isMaxLevel ? '∞' : `${maxXp.toLocaleString()} XP`}</span>
        </div>
      )}
    </div>
  )
}
