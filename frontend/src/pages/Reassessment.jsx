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

// Safely format text or skill name for display
function safeText(val, fallback = '') {
  if (!val) return fallback
  if (typeof val === 'object') {
    return val.en || val.name || Object.values(val)[0] || fallback
  }
  return String(val)
}

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
    return <LoadingScreen message={t('Loading official employee dossier...') || t('system.loading')} />
  }

  return (
    <div className="reassessment-page">
      {/* Hero Header */}
      <div className="page-hero-header">
        <div className="page-hero-content">
          <span className="page-hero-badge badge-amber">{t('reassessment.cycle_badge')}</span>
          <h1 className="page-hero-title">{t('reassessment.page_title')}</h1>
          <p className="page-hero-subtitle">
            {t('reassessment.page_subtitle', { designation: safeText(info?.designationName, 'Official Cadre') })}
          </p>
        </div>
        <div className="page-hero-actions">
          <Link to="/dashboard" className="btn btn-outline btn-sm">
            {t('reassessment.back_dashboard')}
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <strong>{t('Notice:')}</strong> {error}
        </div>
      )}

      {/* 2-Column Info Grid: Previous Summary & Parameters */}
      <div className="reassessment-grid-2col">
        {/* Card 1: Previous Performance */}
        <div className="card" style={{ padding: '24px' }}>
          <div className="card-header-clean">
            <div className="header-title-group">
              <span className="section-pill">{t('reassessment.baseline_pill')}</span>
              <h3 className="section-heading">{t('reassessment.prev_summary_heading')}</h3>
            </div>
            <History size={18} color="#0284c7" />
          </div>
          
          {info?.hasPreviousAssessment && info?.previousAssessment ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', margin: '14px 0 16px' }}>
                <span style={{ fontSize: '36px', fontWeight: '800', color: '#0284c7', lineHeight: 1 }}>
                  {Math.round(info.previousAssessment.overallScore || 0)}%
                </span>
                <span style={{ color: '#64748b', fontSize: '13.5px' }}>
                  {t('reassessment.baseline_score_label')}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><strong>{t('reassessment.completed_on')}</strong> {info.previousAssessment.completedAt && !isNaN(new Date(info.previousAssessment.completedAt).getTime()) ? new Date(info.previousAssessment.completedAt).toLocaleDateString() : '—'}</div>
                <div><strong>{t('reassessment.accuracy')}</strong> {t('reassessment.questions_correct_of', { correct: info.previousAssessment.correctAnswers ?? 0, total: info.previousAssessment.totalQuestions ?? 0 })}</div>
                <div><strong>{t('reassessment.attempt_ref')}</strong> <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{String(info.previousAssessment.id || '').substring(0, 8)}...</code></div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px 0', color: '#64748b' }}>
              <p>{t('reassessment.no_prev_text')}</p>
            </div>
          )}
        </div>

        {/* Card 2: Reassessment Parameters */}
        <div className="card" style={{ padding: '24px', background: '#f8fafc' }}>
          <div className="card-header-clean">
            <div className="header-title-group">
              <span className="section-pill">{t('reassessment.protocol_pill')}</span>
              <h3 className="section-heading">{t('reassessment.params_heading')}</h3>
            </div>
            <Sliders size={18} color="#475569" />
          </div>
          <ul className="assessment-info-list" style={{ marginTop: '14px' }}>
            <li><span>{t('reassessment.total_q')}</span> <strong>{info?.totalQuestions || 6} {t('Questions')}</strong></li>
            <li><span>{t('reassessment.est_time')}</span> <strong>~{Math.round(info?.estimatedTime || 10)} {t('minutes')}</strong></li>
            <li><span>{t('Assessment Details')}:</span> <strong style={{ color: '#15803d' }}>{t('reassessment.calibrated_gaps')}</strong></li>
            <li><span>{t('reassessment.target_cadre')}</span> <strong>{safeText(info?.designationName, '—')}</strong></li>
            <li><span>{t('reassessment.xp_bonus')}</span> <strong style={{ color: '#ff9933' }}>+150 XP</strong></li>
          </ul>
        </div>
      </div>

      {/* Target Skill Gaps to Close */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div className="card-header-clean">
          <div className="header-title-group">
            <span className="section-pill warning">{t('reassessment.target_comp_pill')}</span>
            <h3 className="section-heading">{t('reassessment.target_gaps_heading')}</h3>
          </div>
          <span style={{ fontSize: '13px', color: '#64748b' }}>{t('reassessment.benchmark_std')}</span>
        </div>

        {info?.skillGaps && info.skillGaps.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
            {info.skillGaps.map((g) => {
              const assessed = Number(g.assessedScore ?? 0)
              const required = Number(g.requiredScore ?? 80)
              const isMet = assessed >= required
              const gapVal = Math.max(0, required - assessed)
              const statusClass = isMet ? 'low' : gapVal <= 15 ? 'medium' : 'high'
              const badgeText = isMet ? t('reassessment.benchmark_met') : gapVal <= 15 ? t('reassessment.needs_improvement') : t('reassessment.priority_gap')

              return (
                <div key={g.id || g.skillId} className="gap-card" style={{ margin: 0 }}>
                  <div className="gap-card-top">
                    <span className={`gap-priority-pill priority-${statusClass}`}>
                      {badgeText}
                    </span>
                    <span className="gap-diff-text">
                      {isMet ? t('reassessment.req_met') : t('reassessment.delta_tag', { val: gapVal })}
                    </span>
                  </div>

                  <h4 className="gap-skill-title">{safeText(g.skillName, 'Skill')}</h4>

                  <div className="gap-comparison-row">
                    <div className="gap-metric">
                      <span className="gap-metric-label">{t('reassessment.prev_score')}</span>
                      <strong className="gap-metric-val current">{Math.round(assessed)}%</strong>
                    </div>
                    <div className="gap-arrow">➔</div>
                    <div className="gap-metric">
                      <span className="gap-metric-label">{t('reassessment.req_std')}</span>
                      <strong className="gap-metric-val target">{Math.round(required)}%</strong>
                    </div>
                  </div>

                  {/* Visual gauge */}
                  <div className="skill-progress-track">
                    <div className="benchmark-marker" style={{ left: `${required}%` }} />
                    <div 
                      className={`skill-progress-fill fill-${statusClass}`} 
                      style={{ width: `${Math.min(100, assessed)}%` }} 
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ color: '#64748b', marginTop: '10px' }}>{t('result.no_gaps') || 'No active skill gaps recorded.'}</p>
        )}
      </div>

      {/* Recommended Learning Modules Preview */}
      {info?.recommendedCourses && info.recommendedCourses.length > 0 && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div className="card-header-clean">
            <div className="header-title-group">
              <span className="section-pill">{t('reassessment.prep_pill')}</span>
              <h3 className="section-heading">{t('reassessment.assoc_modules')}</h3>
            </div>
            <Link to="/igot-courses" className="link-sm">
              {t('reassessment.explore_all')}
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
                  <h4 className="course-title-v2">{safeText(c.title, 'Course')}</h4>
                  <div className="course-provider-v2">🏫 {safeText(c.provider, 'iGOT')}</div>
                  <span className="course-skill-pill">{t('igot.competency_prefix', { skill: safeText(c.skillName, '') })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Launch CTA Card */}
      <div className="reassessment-cta-card">
        <span style={{ fontSize: '32px', marginBottom: '8px', display: 'inline-block' }}>🚀</span>
        <h2>{t('reassessment.ready_title')}</h2>
        <p>
          {t('reassessment.ready_desc')}
        </p>

        <button
          type="button"
          onClick={handleStartReassessment}
          disabled={starting || !info || info.totalQuestions === 0}
          className="reassessment-start-btn"
        >
          {starting ? (
            t('reassessment.initializing')
          ) : (
            <>
              <RefreshCw size={18} /> {t('reassessment.start_now_btn')} <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
