import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LoadingScreen from '../components/LoadingScreen'
import { useTranslation } from 'react-i18next'
import { 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle, 
  History, 
  RefreshCw, 
  Sliders, 
  Sparkles, 
  Target, 
  TrendingUp 
} from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function Reassessment() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [info, setInfo] = useState(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    const fetchReassessmentInfo = async () => {
      setLoading(true)
      setError('')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) {
          setError('Authentication required.')
          return
        }

        const res = await fetch(`${BACKEND_URL}/api/assessment/reassessment-info`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Failed to load reassessment details (${res.status}): ${text.substring(0, 100)}`)
        }

        const data = await res.json()
        if (!data.success) throw new Error(data.message || 'Error loading reassessment info')
        setInfo(data)
      } catch (err) {
        console.error('Reassessment load error:', err)
        setError(err.message || 'Error loading reassessment details.')
      } finally {
        setLoading(false)
      }
    }

    fetchReassessmentInfo()
  }, [])

  const handleStartReassessment = async () => {
    setStarting(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch(`${BACKEND_URL}/api/assessment/start-new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Accept-Language': i18n.language
        },
        body: JSON.stringify({ assessmentType: 'reassessment' })
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Failed to initialize reassessment attempt')

      navigate(`/assessment?start=true&type=reassessment`)
    } catch (err) {
      console.error('Start reassessment error:', err)
      setError(err.message || 'Unable to start reassessment')
      setStarting(false)
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading your competency profile & skill gaps..." />
  }

  return (
    <div className="reassessment-page">
      {/* Hero Header */}
      <div className="page-hero-header">
        <div className="page-hero-content">
          <span className="page-hero-badge badge-amber">🔄 Continuous Competency Cycle</span>
          <h1 className="page-hero-title">🎯 AI Competency Reassessment</h1>
          <p className="page-hero-subtitle">
            Validate skill improvements after completing recommended learning modules and update your official competency profile for <strong>{info?.designationName}</strong>.
          </p>
        </div>
        <div className="page-hero-actions">
          <Link to="/dashboard" className="btn btn-outline btn-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* 2-Column Info Grid: Previous Summary & Parameters */}
      <div className="reassessment-grid-2col">
        {/* Card 1: Previous Performance */}
        <div className="card" style={{ padding: '24px' }}>
          <div className="card-header-clean">
            <div className="header-title-group">
              <span className="section-pill">Baseline Benchmark</span>
              <h3 className="section-heading">Previous Assessment Summary</h3>
            </div>
            <History size={18} color="#0284c7" />
          </div>
          
          {info?.hasPreviousAssessment && info?.previousAssessment ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', margin: '14px 0 16px' }}>
                <span style={{ fontSize: '36px', fontWeight: '800', color: '#0284c7', lineHeight: 1 }}>
                  {Math.round(info.previousAssessment.overallScore)}%
                </span>
                <span style={{ color: '#64748b', fontSize: '13.5px' }}>
                  Baseline Competency Score
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><strong>Completed on:</strong> {new Date(info.previousAssessment.completedAt).toLocaleDateString()}</div>
                <div><strong>Accuracy:</strong> {info.previousAssessment.correctAnswers} of {info.previousAssessment.totalQuestions} questions correct</div>
                <div><strong>Attempt Reference:</strong> <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{info.previousAssessment.id.substring(0, 8)}...</code></div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px 0', color: '#64748b' }}>
              <p>No previous assessment on record. This reassessment will establish your baseline competency score.</p>
            </div>
          )}
        </div>

        {/* Card 2: Reassessment Parameters */}
        <div className="card" style={{ padding: '24px', background: '#f8fafc' }}>
          <div className="card-header-clean">
            <div className="header-title-group">
              <span className="section-pill">Test Protocol</span>
              <h3 className="section-heading">Reassessment Parameters</h3>
            </div>
            <Sliders size={18} color="#475569" />
          </div>
          <ul className="assessment-info-list" style={{ marginTop: '14px' }}>
            <li><span>Total Questions:</span> <strong>{info?.totalQuestions || 6} Questions</strong></li>
            <li><span>Estimated Time:</span> <strong>~{Math.round(info?.estimatedTime || 10)} Minutes</strong></li>
            <li><span>Adaptive Difficulty:</span> <strong style={{ color: '#15803d' }}>Calibrated to previous gaps</strong></li>
            <li><span>Target Cadre:</span> <strong>{info?.designationName}</strong></li>
            <li><span>XP Bonus:</span> <strong style={{ color: '#ff9933' }}>+150 Reassessment XP</strong></li>
          </ul>
        </div>
      </div>

      {/* Target Skill Gaps to Close */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div className="card-header-clean">
          <div className="header-title-group">
            <span className="section-pill warning">Target Competencies</span>
            <h3 className="section-heading">Target Skill Gaps to Close</h3>
          </div>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Benchmark standard: 80%</span>
        </div>

        {info?.skillGaps && info.skillGaps.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
            {info.skillGaps.map((g) => {
              const isMet = g.assessedScore >= g.requiredScore
              const gapVal = Math.max(0, g.requiredScore - g.assessedScore)
              const statusClass = isMet ? 'low' : gapVal <= 15 ? 'medium' : 'high'
              const badgeText = isMet ? '✓ Benchmark Met' : gapVal <= 15 ? '⚠ Needs Improvement' : '⚡ Priority Gap'

              return (
                <div key={g.id || g.skillId} className="gap-card" style={{ margin: 0 }}>
                  <div className="gap-card-top">
                    <span className={`gap-priority-pill priority-${statusClass}`}>
                      {badgeText}
                    </span>
                    <span className="gap-diff-text">
                      {isMet ? 'Requirement Met' : `-${gapVal}% Delta`}
                    </span>
                  </div>

                  <h4 className="gap-skill-title">{g.skillName}</h4>

                  <div className="gap-comparison-row">
                    <div className="gap-metric">
                      <span className="gap-metric-label">Previous Score</span>
                      <strong className="gap-metric-val current">{g.assessedScore}%</strong>
                    </div>
                    <div className="gap-arrow">➔</div>
                    <div className="gap-metric">
                      <span className="gap-metric-label">Required Standard</span>
                      <strong className="gap-metric-val target">{g.requiredScore}%</strong>
                    </div>
                  </div>

                  {/* Visual gauge */}
                  <div className="skill-progress-track">
                    <div className="benchmark-marker" style={{ left: `${g.requiredScore}%` }} />
                    <div 
                      className={`skill-progress-fill fill-${statusClass}`} 
                      style={{ width: `${Math.min(100, g.assessedScore)}%` }} 
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ color: '#64748b', marginTop: '10px' }}>No active skill gaps recorded. Start reassessment to establish your competencies.</p>
        )}
      </div>

      {/* Recommended Learning Modules Preview */}
      {info?.recommendedCourses && info.recommendedCourses.length > 0 && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div className="card-header-clean">
            <div className="header-title-group">
              <span className="section-pill">Pre-Assessment Prep</span>
              <h3 className="section-heading">Associated iGOT Learning Modules</h3>
            </div>
            <Link to="/igot-courses" className="link-sm">
              Explore All Courses ➔
            </Link>
          </div>
          
          <div className="courses-grid-3col" style={{ marginTop: '16px', marginBottom: 0 }}>
            {info.recommendedCourses.slice(0, 3).map((c) => (
              <div key={c.id || c.courseId} className="course-card-v2">
                <div>
                  <div className="course-card-top">
                    <span className="course-platform-badge">🏛️ iGOT Module</span>
                    <span className="course-xp-pill">+100 XP</span>
                  </div>
                  <h4 className="course-title-v2">{c.title}</h4>
                  <div className="course-provider-v2">🏫 {c.provider}</div>
                  <span className="course-skill-pill">Competency: {c.skillName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Launch CTA Card */}
      <div className="reassessment-cta-card">
        <span style={{ fontSize: '32px', marginBottom: '8px', display: 'inline-block' }}>🚀</span>
        <h2>Ready to Validate Your Improvement?</h2>
        <p>
          A new reassessment attempt will evaluate your updated statistical knowledge. Scores will recalculate your cadre skill gaps and unlock milestone badges.
        </p>

        <button
          type="button"
          onClick={handleStartReassessment}
          disabled={starting || !info || info.totalQuestions === 0}
          className="reassessment-start-btn"
        >
          {starting ? (
            'Initializing Reassessment...'
          ) : (
            <>
              <RefreshCw size={18} /> Start Reassessment Now <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
