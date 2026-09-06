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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

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
    const fetchResults = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        // 1. Fetch current assessment results
        const resResponse = await fetch(`${BACKEND_URL}/api/assessment/result/${assessmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const resData = await resResponse.json()
        if (!resData.success) throw new Error(resData.message)
        setResult(resData.result)

        // 2. Fetch skill gaps
        const gapResponse = await fetch(`${BACKEND_URL}/api/skill-gap/latest`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const gapData = await gapResponse.json()
        if (gapData.success) setSkillGaps(gapData.skillGaps || [])

        // 3. Fetch latest comparison
        const compResponse = await fetch(`${BACKEND_URL}/api/assessment/latest-comparison`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const compData = await compResponse.json()
        if (compData.success && compData.hasComparison) {
            if (compData.current.id === assessmentId && compData.previous.id !== assessmentId) {
                setComparison(compData)
            }
        }

        // 4. Fetch recommended courses based on gaps
        const recResponse = await fetch(`${BACKEND_URL}/api/recommendations/user`, {
           headers: { Authorization: `Bearer ${token}` }
        })
        if (recResponse.ok && recResponse.headers.get('content-type')?.includes('application/json')) {
           const recData = await recResponse.json()
           if (recData.success) {
              setCourses(recData.recommendations || [])
           }
        }

      } catch (err) {
        setError(err.message || 'Error loading results.')
      } finally {
        setLoading(false)
      }
    }

    if (assessmentId) fetchResults()
  }, [assessmentId])

  // Calculate XP and level
  const earnedXp = useMemo(() => {
    return calculateXpFromAssessment(result)
  }, [result])

  const levelProgress = useMemo(() => {
    return calculateLevel(earnedXp)
  }, [earnedXp])

  if (loading) return <LoadingScreen message="Calculating adaptive skill-wise scores & AI analysis..." />
  if (error || !result) return <div className="alert alert-error" style={{ maxWidth: '900px', margin: '30px auto' }}>{error || 'No assessment data.'}</div>

  const { overallScore, totalQuestions, correctAnswers, skillScores } = result
  const roundedOverall = Math.round(overallScore || 0)
  const animatedOverall = useCountUp(roundedOverall, 1200)
  const animatedEarnedXp = useCountUp(earnedXp, 1000)

  return (
    <div className="result-page">
      {/* Page Hero Header */}
      <div className="page-hero-header">
        <div className="page-hero-content">
          <span className="page-hero-badge badge-green">✓ Evaluation Completed</span>
          <h1 className="page-hero-title">{t('result.title')}</h1>
          <p className="page-hero-subtitle">
            Competency score calibrated against MoSPI official benchmark standards
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
              <span className="result-score-sub">Score</span>
            </div>
          </div>


          <div className="result-meta-info">
            <h2>Overall Competency Rating</h2>
            <p>
              Accuracy: <strong>{correctAnswers} / {totalQuestions} questions correct</strong>
            </p>
            <p style={{ marginTop: '4px' }}>
              Status: <span className="tag tag-auth" style={{ color: '#ffffff' }}>Official Record Updated</span>
            </p>
          </div>
        </div>

        {/* Gamified XP Gain Card */}
        <div className="result-xp-reward-box">
          <span className="xp-icon animated-pulse" aria-hidden="true">✨</span>
          <div className="result-xp-text">
            <span className="xp-val">+{animatedEarnedXp.toLocaleString()} XP</span>
            <span className="xp-lbl">Experience Gained</span>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '14px', marginLeft: '4px' }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block' }}>Current Tier</span>
            <strong style={{ color: '#ffffff', fontSize: '13px' }}>Lvl {levelProgress.level} · {levelProgress.title}</strong>
          </div>
        </div>

      </div>

      {/* Historical Comparison Table (if reassessment) */}
      {comparison && (
        <div className="card comparison-card">
          <div className="card-header-clean">
            <div className="header-title-group">
              <span className="section-pill">Reassessment Delta</span>
              <h3 className="section-heading">{t('result.historical_progression')}</h3>
            </div>
            <span className={`delta-badge ${comparison.current.overall >= comparison.previous.overall ? 'delta-pos' : 'delta-neg'}`}>
              {comparison.current.overall >= comparison.previous.overall ? (
                <>
                  <TrendingUp size={14} /> +{Math.round(comparison.current.overall - comparison.previous.overall)}% {t('result.improvement')}
                </>
              ) : (
                <>
                  <TrendingDown size={14} /> {Math.round(comparison.current.overall - comparison.previous.overall)}% {t('result.decline')}
                </>
              )}
            </span>
          </div>

          <p style={{ color: '#64748b', fontSize: '13.5px', margin: '0 0 12px' }}>
            {t('result.previous_attempt')}: <strong>{Math.round(comparison.previous.overall)}%</strong> &rarr; {t('result.current_attempt')}: <strong>{Math.round(comparison.current.overall)}%</strong>
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
                {comparison.current.scores.map(curr => {
                  const prev = comparison.previous.scores.find(p => p.skill_id === curr.skill_id);
                  const pScore = prev ? Number(prev.score_percentage) : 0;
                  const cScore = Number(curr.score_percentage);
                  const change = cScore - pScore;
                  
                  const skillNameObj = skillScores?.find(s => s.skillId === curr.skill_id);
                  const name = skillNameObj ? skillNameObj.skillName : 'Statistical Competency';

                  return (
                    <tr key={curr.skill_id}>
                      <td style={{ fontWeight: '600' }}>{name}</td>
                      <td>{Math.round(pScore)}%</td>
                      <td style={{ fontWeight: '700' }}>{Math.round(cScore)}%</td>
                      <td>
                        <span className={`delta-badge ${change > 0 ? 'delta-pos' : change < 0 ? 'delta-neg' : 'delta-neutral'}`}>
                          {change > 0 ? `+${Math.round(change)}%` : change < 0 ? `${Math.round(change)}%` : '0%'}
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
            <span className="section-pill">Competency Breakdown</span>
            <h3 className="section-heading">Assessed Skills vs Cadre Benchmark (80%)</h3>
          </div>
        </div>

        {skillScores && skillScores.length > 0 ? (
          <div style={{ marginTop: '14px' }}>
            {skillScores.map((ss) => (
              <SkillScoreBar 
                key={ss.skillId}
                skillName={ss.skillName}
                percentage={ss.percentage}
                questionsCount={ss.questionsCount}
                correctCount={ss.correctCount}
                benchmark={80}
              />
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>No individual skill scores available.</p>
        )}
      </div>

      {/* Skill-Gap Analysis Card */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
        <div className="card-header-clean">
          <div className="header-title-group">
            <span className="section-pill warning">Priority Action</span>
            <h3 className="section-heading">{t('result.skill_gap_analysis')}</h3>
          </div>
          <span style={{ fontSize: '13px', color: '#64748b' }}>{skillGaps.length} Target Gaps Identified</span>
        </div>

        {skillGaps.length === 0 ? (
          <p style={{ color: '#15803d', fontWeight: '600' }}>✓ {t('result.no_gaps')}</p>
        ) : (
          <div className="gaps-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
            {skillGaps.map(gap => {
              const gapVal = Math.max(0, gap.requiredScore - gap.assessedScore);
              const isMet = gap.assessedScore >= gap.requiredScore;
              
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
                <div key={gap.id} className="gap-card" style={{ margin: 0 }}>
                  <div className="gap-card-top">
                    <span className={`gap-priority-pill priority-${statusClass}`}>
                      {statusText}
                    </span>
                    <span className="gap-diff-text">
                      {isMet ? 'Benchmark Met' : `-${gapVal}% Delta`}
                    </span>
                  </div>

                  <h4 className="gap-skill-title">{gap.skillName}</h4>

                  <div className="gap-comparison-row">
                    <div className="gap-metric">
                      <span className="gap-metric-label">{t('result.current')}</span>
                      <strong className="gap-metric-val current">{gap.assessedScore}%</strong>
                    </div>
                    <div className="gap-arrow" aria-hidden="true">➔</div>
                    <div className="gap-metric">
                      <span className="gap-metric-label">{t('result.required')}</span>
                      <strong className="gap-metric-val target">{gap.requiredScore}%</strong>
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
            <span className="section-pill">Curated Learning</span>
            <h3 className="section-heading">{t('result.recommended_courses')}</h3>
          </div>
          <Link to="/igot-courses" className="link-sm">
            {t('result.explore_courses')} ➔
          </Link>
        </div>

        {courses.length === 0 ? (
          <p style={{ color: '#15803d', fontWeight: '600' }}>✓ {t('result.all_met')}</p>
        ) : (
          <div className="courses-grid-3col" style={{ marginTop: '16px', marginBottom: 0 }}>
            {courses.slice(0, 3).map((rec) => (
              <div key={rec.id} className="course-card-v2">
                <div>
                  <div className="course-card-top">
                    <span className="course-platform-badge">🏛️ iGOT Karmayogi</span>
                    <span className="course-xp-pill">+100 XP</span>
                  </div>
                  <h4 className="course-title-v2">{rec.title}</h4>
                  <div className="course-provider-v2">🏫 {rec.provider}</div>
                  <p className="course-desc-v2">💡 {rec.reason}</p>
                </div>
                <div>
                  <a
                    href={rec.externalUrl || 'https://igotkarmayogi.gov.in/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm btn-block"
                  >
                    View Module on iGOT →
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
