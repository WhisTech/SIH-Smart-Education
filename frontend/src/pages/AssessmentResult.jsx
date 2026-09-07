import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LoadingScreen from '../components/LoadingScreen'
import SkillScoreBar from '../components/SkillScoreBar'
import { calculateXpFromAssessment, calculateLevel } from '../lib/gamification'
import { useCountUp } from '../lib/useCountUp'
import { useTranslation } from 'react-i18next'
import { 
  Award, 
  CheckCircle2, 
  ExternalLink, 
  GraduationCap, 
  RefreshCw, 
  Sparkles, 
  TrendingDown, 
  TrendingUp,
  ArrowRight
} from 'lucide-react'

// Safely format text or skill name for display
function safeText(val, fallback = '') {
  if (!val) return fallback
  if (typeof val === 'object') {
    return val.en || val.name || Object.values(val)[0] || fallback
  }
  return String(val)
}

export default function AssessmentResult() {
  const { assessmentId } = useParams()
  const { t } = useTranslation()

  const [result, setResult] = useState(null)
  const [skillGaps, setSkillGaps] = useState([])
  const [comparison, setComparison] = useState(null)
  const [courses, setCourses] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchResults = async () => {
      setLoading(true)
      setError('')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        // 1. Fetch current assessment results
        const resResponse = await fetch(`${BACKEND_URL}/api/assessment/result/${assessmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const resData = await resResponse.json()
        if (!resData.success) throw new Error(resData.message || 'Failed to load assessment result')
        if (isMounted) {
          setResult(resData.result || null)
        }

        // 2. Fetch skill gaps (safe fallback)
        try {
          const gapResponse = await fetch(`${BACKEND_URL}/api/skill-gap/latest`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const gapData = await gapResponse.json()
          if (isMounted && gapData.success && Array.isArray(gapData.skillGaps)) {
            setSkillGaps(gapData.skillGaps)
          }
        } catch (gapErr) {
          console.warn('Skill gaps fetch warning:', gapErr)
        }

        // 3. Fetch latest comparison (safe fallback)
        try {
          const compResponse = await fetch(`${BACKEND_URL}/api/assessment/latest-comparison`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const compData = await compResponse.json()
          if (isMounted && compData.success && compData.hasComparison && compData.current && compData.previous) {
            if (compData.current.id === assessmentId && compData.previous.id !== assessmentId) {
              setComparison({
                current: {
                  id: compData.current.id,
                  overall: Number(compData.current.overall || 0),
                  scores: Array.isArray(compData.current.scores) ? compData.current.scores : []
                },
                previous: {
                  id: compData.previous.id,
                  overall: Number(compData.previous.overall || 0),
                  scores: Array.isArray(compData.previous.scores) ? compData.previous.scores : []
                }
              })
            }
          }
        } catch (compErr) {
          console.warn('Comparison fetch warning:', compErr)
        }

        // 4. Fetch recommended courses based on gaps (safe fallback)
        try {
          const recResponse = await fetch(`${BACKEND_URL}/api/recommendations/user`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (recResponse.ok && recResponse.headers.get('content-type')?.includes('application/json')) {
            const recData = await recResponse.json()
            if (isMounted && recData.success && Array.isArray(recData.recommendations)) {
              setCourses(recData.recommendations)
            }
          }
        } catch (recErr) {
          console.warn('Recommendations fetch warning:', recErr)
        }

      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Error loading assessment results.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (assessmentId) {
      fetchResults()
    } else {
      setError('Invalid assessment ID.')
      setLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [assessmentId])

  // Calculate XP and level
  const earnedXp = useMemo(() => {
    return calculateXpFromAssessment(result)
  }, [result])

  const levelProgress = useMemo(() => {
    return calculateLevel(earnedXp)
  }, [earnedXp])

  const roundedOverall = Math.round(Number(result?.overallScore) || 0)
  const animatedOverall = useCountUp(roundedOverall, 1200)
  const animatedEarnedXp = useCountUp(earnedXp || 0, 1000)

  if (loading) {
    return <LoadingScreen message={t('Calculating scores, analyzing competency & skill gaps...')} />
  }

  if (error || !result) {
    return (
      <div className="result-page" style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <strong>{t('Notice:')}</strong> {error || t('No assessment data available for this session.')}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/assessment" className="btn btn-primary">
            {t('Take Assessment')}
          </Link>
          <Link to="/dashboard" className="btn btn-outline">
            {t('result.back_dashboard')}
          </Link>
        </div>
      </div>
    )
  }

  const { overallScore = 0, totalQuestions = 0, correctAnswers = 0, skillScores = [] } = result
  const safeSkillScores = Array.isArray(skillScores) ? skillScores : []
  const safeSkillGaps = Array.isArray(skillGaps) ? skillGaps : []
  const safeCourses = Array.isArray(courses) ? courses : []

  // Safe comparison data calculations
  const hasValidComparison = Boolean(
    comparison &&
    comparison.current &&
    comparison.previous &&
    Array.isArray(comparison.current.scores) &&
    comparison.current.scores.length > 0
  )

  const currentOverall = comparison ? Math.round(Number(comparison.current?.overall || 0)) : 0
  const previousOverall = comparison ? Math.round(Number(comparison.previous?.overall || 0)) : 0
  const overallDiff = currentOverall - previousOverall

  return (
    <div className="result-page">
      {/* Page Hero Header */}
      <div className="page-hero-header">
        <div className="page-hero-content">
          <span className="page-hero-badge badge-green">✓ {t('Evaluation Completed')}</span>
          <h1 className="page-hero-title">{t('result.title')}</h1>
          <p className="page-hero-subtitle">
            {t('Competency score calibrated against MoSPI official benchmark standards')}
          </p>
        </div>
        <div className="page-hero-actions">
          <Link to="/reassessment" className="btn btn-primary btn-sm">
            <RefreshCw size={15} /> {t('reassessment.start_reassessment')}
          </Link>
          <Link to="/assessment" className="btn btn-outline btn-sm">
            {t('result.take_another')}
          </Link>
        </div>
      </div>

      {/* Hero Score Showcase Banner */}
      <div className="result-score-banner" style={{ '--score-pct': `${animatedOverall}%` }}>
        <div className="result-score-main">
          <div className="result-score-ring">
            <div className="result-score-inner">
              <span className="result-score-pct-text">{animatedOverall}%</span>
              <span className="result-score-sub">{t('Score')}</span>
            </div>
          </div>

          <div className="result-meta-info">
            <h2>{t('Overall Competency Rating')}</h2>
            <p>
              {t('reassessment.accuracy')} <strong>{correctAnswers} / {totalQuestions} {t('questions correct')}</strong>
            </p>
            <p style={{ marginTop: '4px' }}>
              {t('Status:')} <span className="tag tag-auth" style={{ color: '#ffffff' }}>{t('Official Record Updated')}</span>
            </p>
          </div>
        </div>

        {/* Gamified XP Gain Card */}
        <div className="result-xp-reward-box">
          <span className="xp-icon animated-pulse" aria-hidden="true">✨</span>
          <div className="result-xp-text">
            <span className="xp-val">+{animatedEarnedXp.toLocaleString()} XP</span>
            <span className="xp-lbl">{t('Experience Gained')}</span>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '14px', marginLeft: '4px' }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block' }}>{t('Current Tier')}</span>
            <strong style={{ color: '#ffffff', fontSize: '13px' }}>
              Lvl {levelProgress?.level || 1} · {levelProgress?.title || 'Probationer'}
            </strong>
          </div>
        </div>
      </div>

      {/* Historical Comparison Table (if reassessment with valid comparison) */}
      {hasValidComparison && (
        <div className="card comparison-card">
          <div className="card-header-clean">
            <div className="header-title-group">
              <span className="section-pill">{t('Reassessment Delta')}</span>
              <h3 className="section-heading">{t('result.historical_progression')}</h3>
            </div>
            <span className={`delta-badge ${overallDiff >= 0 ? 'delta-pos' : 'delta-neg'}`}>
              {overallDiff >= 0 ? (
                <>
                  <TrendingUp size={14} /> +{overallDiff}% {t('result.improvement')}
                </>
              ) : (
                <>
                  <TrendingDown size={14} /> {overallDiff}% {t('result.decline')}
                </>
              )}
            </span>
          </div>

          <p style={{ color: '#64748b', fontSize: '13.5px', margin: '0 0 12px' }}>
            {t('result.previous_attempt')}: <strong>{previousOverall}%</strong> &rarr; {t('result.current_attempt')}: <strong>{currentOverall}%</strong>
          </p>

          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>{t('dashboard.skill')}</th>
                  <th>{t('result.previous_score')}</th>
                  <th>{t('result.current_score')}</th>
                  <th>{t('result.change')}</th>
                  <th>{t('result.status')}</th>
                </tr>
              </thead>
              <tbody>
                {(comparison.current.scores || []).map((curr) => {
                  const previousScoresList = Array.isArray(comparison.previous?.scores) ? comparison.previous.scores : []
                  const prev = previousScoresList.find((p) => p && p.skill_id === curr.skill_id)
                  const pScore = prev ? Number(prev.score_percentage || 0) : 0
                  const cScore = Number(curr.score_percentage || 0)
                  const change = Math.round(cScore - pScore)
                  
                  const skillNameObj = safeSkillScores.find((s) => s.skillId === curr.skill_id)
                  const name = skillNameObj ? safeText(skillNameObj.skillName, 'Statistical Competency') : 'Statistical Competency'

                  return (
                    <tr key={curr.skill_id || Math.random()}>
                      <td style={{ fontWeight: '600' }}>{name}</td>
                      <td>{Math.round(pScore)}%</td>
                      <td style={{ fontWeight: '700' }}>{Math.round(cScore)}%</td>
                      <td>
                        <span className={`delta-badge ${change > 0 ? 'delta-pos' : change < 0 ? 'delta-neg' : 'delta-neutral'}`}>
                          {change > 0 ? `+${change}%` : change < 0 ? `${change}%` : '0%'}
                        </span>
                      </td>
                      <td>
                        <span className={`tag ${change >= 0 ? 'tag-success' : 'tag-warning'}`}>
                          {change > 0 ? `↑ ${t('result.improved')}` : change < 0 ? `↓ ${t('result.declined')}` : t('result.unchanged')}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Skill Scores with Benchmark Marker */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
        <div className="card-header-clean">
          <div className="header-title-group">
            <span className="section-pill">{t('Competency Breakdown')}</span>
            <h3 className="section-heading">{t('Assessed Skills vs Cadre Benchmark (80%)')}</h3>
          </div>
        </div>

        {safeSkillScores.length > 0 ? (
          <div style={{ marginTop: '14px' }}>
            {safeSkillScores.map((ss) => (
              <SkillScoreBar 
                key={ss.skillId || ss.skillName}
                skillName={safeText(ss.skillName, 'Skill')}
                percentage={ss.percentage || 0}
                questionsCount={ss.questionsCount}
                correctCount={ss.correctCount}
                benchmark={80}
              />
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>{t('No individual skill scores available.')}</p>
        )}
      </div>

      {/* Skill-Gap Analysis Card */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
        <div className="card-header-clean">
          <div className="header-title-group">
            <span className="section-pill warning">{t('Priority Action')}</span>
            <h3 className="section-heading">{t('result.skill_gap_analysis')}</h3>
          </div>
          <span style={{ fontSize: '13px', color: '#64748b' }}>{safeSkillGaps.length} {t('Target Gaps Identified')}</span>
        </div>

        {safeSkillGaps.length === 0 ? (
          <p style={{ color: '#15803d', fontWeight: '600' }}>✓ {t('result.no_gaps')}</p>
        ) : (
          <div className="gaps-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
            {safeSkillGaps.map((gap) => {
              const assessed = Number(gap.assessedScore ?? 0)
              const required = Number(gap.requiredScore ?? 80)
              const gapVal = Math.max(0, Math.round(required - assessed))
              const isMet = assessed >= required
              
              let statusClass = 'high'
              let statusText = t('result.high_priority')
              if (isMet) {
                statusClass = 'low'
                statusText = t('result.meets_req')
              } else if (gapVal <= 15) {
                statusClass = 'medium'
                statusText = t('result.needs_improvement')
              }

              return (
                <div key={gap.id || gap.skillId || Math.random()} className="gap-card" style={{ margin: 0 }}>
                  <div className="gap-card-top">
                    <span className={`gap-priority-pill priority-${statusClass}`}>
                      {statusText}
                    </span>
                    <span className="gap-diff-text">
                      {isMet ? t('Benchmark Met') : `-${gapVal}% ${t('Delta')}`}
                    </span>
                  </div>

                  <h4 className="gap-skill-title">{safeText(gap.skillName, 'Competency Skill')}</h4>

                  <div className="gap-comparison-row">
                    <div className="gap-metric">
                      <span className="gap-metric-label">{t('result.current')}</span>
                      <strong className="gap-metric-val current">{Math.round(assessed)}%</strong>
                    </div>
                    <div className="gap-arrow" aria-hidden="true">➔</div>
                    <div className="gap-metric">
                      <span className="gap-metric-label">{t('result.required')}</span>
                      <strong className="gap-metric-val target">{Math.round(required)}%</strong>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recommended Courses Card */}
      <div className="card" style={{ padding: '24px' }}>
        <div className="card-header-clean">
          <div className="header-title-group">
            <span className="section-pill">{t('Curated Learning')}</span>
            <h3 className="section-heading">{t('result.recommended_courses')}</h3>
          </div>
          <Link to="/igot-courses" className="link-sm">
            {t('result.explore_courses')} ➔
          </Link>
        </div>

        {safeCourses.length === 0 ? (
          <p style={{ color: '#15803d', fontWeight: '600' }}>✓ {t('result.all_met')}</p>
        ) : (
          <div className="courses-grid-3col" style={{ marginTop: '16px', marginBottom: 0 }}>
            {safeCourses.slice(0, 3).map((rec) => (
              <div key={rec.id || rec.courseId || Math.random()} className="course-card-v2">
                <div>
                  <div className="course-card-top">
                    <span className="course-platform-badge">🏛️ iGOT Karmayogi</span>
                    <span className="course-xp-pill">+100 XP</span>
                  </div>
                  <h4 className="course-title-v2">{safeText(rec.title, 'Official Skill Module')}</h4>
                  <div className="course-provider-v2">🏫 {safeText(rec.provider, 'iGOT Karmayogi')}</div>
                  <p className="course-desc-v2">💡 {safeText(rec.reason, 'Recommended based on skill analysis')}</p>
                </div>
                <div>
                  <a
                    href={rec.externalUrl || 'https://igotkarmayogi.gov.in/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm btn-block"
                  >
                    {t('View Module on iGOT →')}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
