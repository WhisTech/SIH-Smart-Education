// ============================================================================
// Gamification Service (UI & Client-Side Calculation Layer)
// MoSPI Skill Intelligence Platform
// 
// NOTE: This is a client-side computation layer that turns real assessment
// scores into visual XP, Levels, and Badges. No fake activity is generated.
// All values are calculated deterministically from the user's actual data.
// ============================================================================

// Base XP Constants
export const XP_CONFIG = {
  POINTS_PER_PERCENT: 10,          // 100% score = 1000 base XP
  POINTS_PER_QUESTION_CORRECT: 25, // Bonus XP per correct answer
  ASSESSMENT_COMPLETION_BONUS: 100,// Flat bonus for completing an assessment
  REASSESSMENT_BONUS: 150,         // Flat bonus for completing a reassessment
  CYCLE_COMPLETION_BONUS: 500,     // Special bonus for full competency cycle completion
}

// Level Thresholds & Government Cadre-aligned Titles
export const LEVEL_TIERS = [
  { level: 1, title: 'Probationer', minXp: 0, maxXp: 499, badgeColor: '#64748b' },
  { level: 2, title: 'Junior Analyst', minXp: 500, maxXp: 1199, badgeColor: '#0284c7' },
  { level: 3, title: 'Senior Analyst', minXp: 1200, maxXp: 2199, badgeColor: '#1f4e79' },
  { level: 4, title: 'Competency Lead', minXp: 2200, maxXp: 3499, badgeColor: '#138808' },
  { level: 5, title: 'Domain Expert', minXp: 3500, maxXp: 4999, badgeColor: '#ff9933' },
  { level: 6, title: 'Master Statistician', minXp: 5000, maxXp: 99999, badgeColor: '#7c3aed' },
]

/**
 * Calculates total XP earned from an assessment object and workflow completion status.
 * Returns 0 if no assessment exists.
 */
export function calculateXpFromAssessment(assessment, isCycleCompleted = false) {
  if (!assessment) return 0

  const scorePct = Number(assessment.overallScore || assessment.score_percentage || 0)
  const correct = Number(assessment.correctAnswers || assessment.correct_answers || 0)
  const isReassessment = assessment.assessment_type === 'reassessment'

  let totalXp = 0
  
  // Score-based XP
  totalXp += Math.round(scorePct * XP_CONFIG.POINTS_PER_PERCENT)
  
  // Question accuracy bonus
  totalXp += correct * XP_CONFIG.POINTS_PER_QUESTION_CORRECT

  // Completion bonus
  totalXp += isReassessment 
    ? XP_CONFIG.REASSESSMENT_BONUS 
    : XP_CONFIG.ASSESSMENT_COMPLETION_BONUS

  // Full Competency Cycle Completion Bonus
  if (isCycleCompleted) {
    totalXp += XP_CONFIG.CYCLE_COMPLETION_BONUS
  }

  return Math.max(0, totalXp)
}

/**
 * Given a total XP, determines current level, next level, and progress percent.
 */
export function calculateLevel(totalXp = 0) {
  const xp = Math.max(0, Number(totalXp) || 0)

  let currentTier = LEVEL_TIERS[0]
  for (const tier of LEVEL_TIERS) {
    if (xp >= tier.minXp) {
      currentTier = tier
    } else {
      break
    }
  }

  const isMaxLevel = currentTier.level === LEVEL_TIERS[LEVEL_TIERS.length - 1].level
  const xpInCurrentLevel = xp - currentTier.minXp
  const xpSpanForLevel = isMaxLevel ? 1000 : (currentTier.maxXp - currentTier.minXp + 1)
  const progressPercent = isMaxLevel 
    ? 100 
    : Math.min(100, Math.round((xpInCurrentLevel / xpSpanForLevel) * 100))

  return {
    level: currentTier.level,
    title: currentTier.title,
    badgeColor: currentTier.badgeColor,
    currentXp: xp,
    minXp: currentTier.minXp,
    maxXp: currentTier.maxXp,
    xpInCurrentLevel,
    xpNeededForNext: isMaxLevel ? 0 : Math.max(0, currentTier.maxXp + 1 - xp),
    progressPercent,
    isMaxLevel,
  }
}

/**
 * Achievement badges determined from real assessment, skill gaps, and workflow cycle data.
 * No fake achievements — earned only when actual criteria are met.
 */
export const BADGE_DEFINITIONS = [
  {
    id: 'first_assessment',
    title: 'First Step',
    icon: '🎯',
    description: 'Completed your first official AI competency assessment',
    checkEarned: (assessment) => Boolean(assessment),
  },
  {
    id: 'high_scorer',
    title: 'Merit Holder',
    icon: '🌟',
    description: 'Achieved 80% or higher overall competency score',
    checkEarned: (assessment) => {
      const score = Number(assessment?.overallScore || assessment?.score_percentage || 0)
      return score >= 80
    },
  },
  {
    id: 'perfectionist',
    title: 'Flawless Section',
    icon: '🏆',
    description: 'Scored 100% on at least one statistical skill domain',
    checkEarned: (assessment) => {
      const scores = assessment?.skillScores || []
      return scores.some(s => Number(s.percentage) === 100)
    },
  },
  {
    id: 'gap_closer',
    title: 'Active Learner',
    icon: '📚',
    description: 'Identified competency benchmarks and registered for learning',
    checkEarned: (assessment, gaps = [], workflow = null) => {
      if (workflow?.stage3_skillGaps?.completed) return true
      return Boolean(assessment) && gaps.length > 0
    },
  },
  {
    id: 'reassessment_ready',
    title: 'Resilient Analyst',
    icon: '🔄',
    description: 'Participated in a competency reassessment cycle',
    checkEarned: (assessment, gaps = [], workflow = null) => {
      if (workflow?.stage4_reassessment?.completed) return true
      return assessment?.assessment_type === 'reassessment'
    },
  },
  {
    id: 'cycle_master',
    title: 'Cycle Master',
    icon: '👑',
    description: 'Successfully completed the entire 4-stage MoSPI competency cycle',
    checkEarned: (assessment, gaps = [], workflow = null) => {
      if (workflow?.isCycleFullyCompleted) return true
      return assessment?.assessment_type === 'reassessment' && Boolean(assessment)
    },
  },
]

/**
 * Returns list of badges with earned boolean flag based on user data.
 */
export function getEarnedBadges(assessment = null, gaps = [], workflow = null) {
  return BADGE_DEFINITIONS.map(badge => ({
    id: badge.id,
    title: badge.title,
    icon: badge.icon,
    description: badge.description,
    earned: badge.checkEarned(assessment, gaps, workflow),
  }))
}
