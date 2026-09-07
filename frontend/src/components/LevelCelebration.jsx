import React from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Trophy, X } from 'lucide-react'

/**
 * LevelCelebration Component
 * Renders a celebration modal with floating confetti particles and glowing badge.
 */
export default function LevelCelebration({ 
  show = false, 
  onClose, 
  level = 1, 
  title = 'Probationer', 
  xp = 0 
}) {
  const { t } = useTranslation()
  if (!show) return null

  // Generate 24 randomized confetti particles
  const particles = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    left: `${(i * 4.2) + Math.random() * 3}%`,
    delay: `${(i % 6) * 0.15}s`,
    duration: `${1.8 + (i % 5) * 0.3}s`,
    color: ['#ff9933', '#138808', '#0284c7', '#f59e0b', '#7c3aed', '#ec4899'][i % 6],
    size: `${8 + (i % 4) * 3}px`
  }))

  return (
    <div className="celebration-overlay" onClick={onClose} role="dialog" aria-modal="true">
      {/* Confetti Rain */}
      <div className="confetti-container" aria-hidden="true">
        {particles.map((p) => (
          <span 
            key={p.id} 
            className="confetti-particle" 
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              backgroundColor: p.color,
              width: p.size,
              height: p.size
            }}
          />
        ))}
      </div>

      {/* Celebration Card */}
      <div className="celebration-card" onClick={(e) => e.stopPropagation()}>
        <button 
          type="button" 
          className="celebration-close-btn" 
          onClick={onClose}
          aria-label="Close celebration"
        >
          <X size={18} />
        </button>

        <div className="celebration-icon-glow">
          <div className="celebration-aura" />
          <Trophy size={48} className="celebration-trophy" />
        </div>

        <span className="celebration-tag">{t('gamification.tier_milestone') || '⭐ COMPETENCY TIER MILESTONE ⭐'}</span>
        <h2 className="celebration-title">{t('gamification.level_unlocked', { level }) || `Level ${level} Unlocked!`}</h2>
        <h3 className="celebration-role">{title}</h3>

        <p className="celebration-desc">
          {t('gamification.celebration_desc', { xp: xp.toLocaleString() }) || `Outstanding work! Your verified MoSPI statistical competencies have earned you ${xp.toLocaleString()} XP and elevated your cadre rank.`}
        </p>

        <div className="celebration-xp-pill">
          <Sparkles size={16} color="#ff9933" />
          <span>{t('gamification.benchmark_satisfied') || 'Tier Competency Benchmark Satisfied'}</span>
        </div>

        <button 
          type="button" 
          className="btn btn-primary celebration-cta"
          onClick={onClose}
        >
          {t('gamification.continue_learning') || 'Continue Learning ➔'}
        </button>
      </div>
    </div>
  )
}
