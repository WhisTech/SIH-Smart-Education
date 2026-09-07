import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { fetchDesignations } from '../lib/referenceData'
import LoadingScreen from '../components/LoadingScreen'
import LevelBadge from '../components/LevelBadge'
import XpBar from '../components/XpBar'
import SkillScoreBar from '../components/SkillScoreBar'
import AchievementCard from '../components/AchievementCard'
import LevelCelebration from '../components/LevelCelebration'
import { calculateXpFromAssessment, calculateLevel, getEarnedBadges } from '../lib/gamification'
import { useCountUp } from '../lib/useCountUp'
import { useTranslation } from 'react-i18next'
import { 
  Award, 
  BrainCircuit, 
  CheckCircle2, 
  ChevronRight, 
  GraduationCap, 
  Sparkles, 
  Target, 
  TrendingUp, 
  UserCheck, 
  Zap,
  RefreshCw,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function Dashboard() {
  const { user, profile, profileLoading } = useAuth()
  const { t } = useTranslation()

  const [designations, setDesignations] = useState([])

  // Latest Assessment state
  const [latestAssessment, setLatestAssessment] = useState(null)
  const [assessmentLoading, setAssessmentLoading] = useState(true)

  // Real Workflow & Achievement status from backend
  const [workflowStatus, setWorkflowStatus] = useState(null)
  const [workflowLoading, setWorkflowLoading] = useState(true)

  // Celebration modal state
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationShownOnce, setCelebrationShownOnce] = useState(false)

  // Load designations reference
  useEffect(() => {
    let isMounted = true
    fetchDesignations().then((res) => {
      if (isMounted) {
        setDesignations(res.data || [])
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Load latest assessment and real workflow status from backend
  useEffect(() => {
    let isMounted = true

    const loadDashboardData = async () => {
      if (!profile?.id) {
        if (isMounted) {
          setAssessmentLoading(false)
          setWorkflowLoading(false)
        }
        return
      }

      setAssessmentLoading(true)
      setWorkflowLoading(true)

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        if (token) {
          const [assessRes, workflowRes] = await Promise.all([
            fetch(`${BACKEND_URL}/api/assessment/user/latest`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`${BACKEND_URL}/api/assessment/user/workflow-status`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          ])

          const assessData = await assessRes.json()
          const workflowData = await workflowRes.json()

          if (isMounted) {
            if (assessData.success) {
              setLatestAssessment(assessData.latestAssessment)
            }
            if (workflowData.success) {
              setWorkflowStatus(workflowData)
              
              // Automatically trigger celebration once if complete competency cycle is detected
              if (workflowData.workflow?.isCycleFullyCompleted && !celebrationShownOnce) {
                setShowCelebration(true)
                setCelebrationShownOnce(true)
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err)
      } finally {
        if (isMounted) {
          setAssessmentLoading(false)
          setWorkflowLoading(false)
        }
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [profile?.id, celebrationShownOnce])

  // Extract real workflow stages
  const workflow = workflowStatus?.workflow
  const isCycleComplete = Boolean(workflow?.isCycleFullyCompleted)

  // Compute Gamification Level & XP from real data
  const totalXp = useMemo(() => {
    if (workflowStatus?.totalXp != null) return workflowStatus.totalXp
    return calculateXpFromAssessment(latestAssessment, isCycleComplete)
  }, [workflowStatus, latestAssessment, isCycleComplete])

  const levelInfo = useMemo(() => {
    return calculateLevel(totalXp)
  }, [totalXp])

  const earnedBadges = useMemo(() => {
    if (workflowStatus?.achievements && workflowStatus.achievements.length > 0) {
      return workflowStatus.achievements
    }
    return getEarnedBadges(latestAssessment, [], workflow)
  }, [workflowStatus, latestAssessment, workflow])

  // Animated KPI score numbers
  const rawScore = Math.round(latestAssessment?.overallScore || 0)
  const animatedScore = useCountUp(rawScore, 1200)

  if (profileLoading) {
    return <LoadingScreen message={t('system.loading')} />
  }

  // Lookup designation name
  const designationName =
    designations.find((d) => d.id === profile?.designation_id)?.name ||
    profile?.designation_id ||
    'Official Statistical Cadre'

  const firstInitial =
    profile?.name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'O'

  // Determine active step when cycle is incomplete
  const s1Done = Boolean(workflow?.stage1_profile?.completed || (profile?.id && profile?.designation_id))
  const s2Done = Boolean(workflow?.stage2_assessment?.completed || latestAssessment)
  const s3Done = Boolean(workflow?.stage3_skillGaps?.completed)
  const s4Done = Boolean(workflow?.stage4_reassessment?.completed || latestAssessment?.assessment_type === 'reassessment')

  return (
    <div className="dashboard modern-dashboard">
      
      {/* Visual Celebration Modal when level badge is clicked or cycle completes */}
      <LevelCelebration 
        show={showCelebration}
        onClose={() => setShowCelebration(false)}
        level={levelInfo.level}
        title={levelInfo.title}
        xp={levelInfo.currentXp}
      />

      {/* 1. HERO BANNER: Profile, Level Badge & Animated XP Progress */}
      <div className="dashboard-hero-banner animate-slide-in">
        <div className="hero-profile-row">
          <Link 
            to="/profile" 
            className="hero-avatar-box" 
            title="View Official Employee Profile"
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            <div className="avatar hero-avatar hero-avatar-pulse" aria-hidden="true">
              {firstInitial}
            </div>
            <span className="hero-verified-dot" title="Official ISS Officer" />
          </Link>

          <Link 
            to="/profile" 
            className="hero-info" 
            title="View Official Employee Profile"
            style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <div className="hero-tag-row">
              <span className="gov-cadre-tag">{t('dashboard.cadre_tag')}</span>
              {profile?.employee_id && (
                <span className="hero-emp-id">OID: <code>{profile.employee_id}</code></span>
              )}
            </div>
            <h1 className="hero-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {profile?.name || t('dashboard.welcome')}
              <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>➔</span>
            </h1>
            <p className="hero-meta">
              <strong>{designationName}</strong> · {profile?.department || 'Official Statistical System'}
            </p>
          </Link>

          <div className="hero-gamification-widget">
            <LevelBadge 
              level={levelInfo.level} 
              title={levelInfo.title} 
              badgeColor={levelInfo.badgeColor}
              size="lg"
              onClick={() => setShowCelebration(true)}
            />
          </div>
        </div>

        {/* Animated XP Progress Bar with Shimmer */}
        <div className="hero-xp-wrapper">
          <XpBar 
            currentXp={levelInfo.currentXp}
            minXp={levelInfo.minXp}
            maxXp={levelInfo.maxXp}
            progressPercent={levelInfo.progressPercent}
            xpNeededForNext={levelInfo.xpNeededForNext}
            isMaxLevel={levelInfo.isMaxLevel}
          />
        </div>
      </div>

      {!profile ? (
        <div className="empty-state">
          <span className="brand-emblem large">⚠️</span>
          <h2>{t('dashboard.profile_not_found')}</h2>
          <p>
            {t('dashboard.profile_not_found_desc')}
          </p>
          <Link to="/profile" className="btn btn-primary">
            {t('dashboard.setup_profile')}
          </Link>
        </div>
      ) : (
        <>
          {/* 2. QUICK STATS KPI CARDS (Animated Stagger) */}
          <div className="stat-grid modern-stat-grid">
            <div className="stat-card modern-stat-card animate-stagger-1">
              <div className="stat-icon-box bg-blue">
                <UserCheck size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">{t('profile.employee_id')}</span>
                <span className="stat-value"><code>{profile.employee_id || '—'}</code></span>
              </div>
            </div>

            <div className="stat-card modern-stat-card animate-stagger-2">
              <div className="stat-icon-box bg-indigo">
                <Target size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">{t('profile.designation')}</span>
                <span className="stat-value truncate" title={designationName}>{designationName}</span>
              </div>
            </div>

            <div className="stat-card modern-stat-card animate-stagger-3">
              <div className="stat-icon-box bg-green">
                <Award size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">{t('dashboard.competency_score')}</span>
                <span className="stat-value" style={{ color: latestAssessment ? '#15803d' : '#0f172a' }}>
                  {latestAssessment ? `${animatedScore}%` : t('dashboard.pending')}
                </span>
              </div>
            </div>

            <div className="stat-card modern-stat-card animate-stagger-4">
              <div className="stat-icon-box bg-amber">
                <TrendingUp size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">{t('dashboard.experience')}</span>
                <span className="stat-value">
                  {profile.experience_years != null ? `${profile.experience_years} ${t('dashboard.years')}` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. DYNAMIC COMPETENCY WORKFLOW SECTION */}
          {/* IMPORTANT RULE: Only visible while the cycle is incomplete. When all 4 stages are completed, it is removed/hidden. */}
          {!isCycleComplete && (
            <div className="card learning-journey-card animate-card">
              <div className="card-header-clean">
                <div className="header-title-group">
                  <span className="section-pill">{t('dashboard.active_cycle')}</span>
                  <h3 className="section-heading">{t('dashboard.cycle_heading')}</h3>
                </div>
                <span className="cycle-subtext">{t('dashboard.cycle_subtext')}</span>
              </div>

              <div className="journey-track-grid">
                {/* Stage 1: Profile & Skills */}
                <Link 
                  to="/profile" 
                  className={`journey-step ${s1Done ? 'completed' : 'current'}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="step-circle">
                    {s1Done ? <CheckCircle2 size={18} /> : '1'}
                  </div>
                  <div className="step-content">
                    <strong className="step-title">{t('dashboard.stage_1_title')}</strong>
                    <span className="step-desc">
                      {workflow?.stage1_profile?.description || 'Designation & competencies'}
                    </span>
                  </div>
                </Link>

                <div className={`journey-connector ${s1Done ? 'active' : ''}`} />

                {/* Stage 2: AI Assessment */}
                <Link 
                  to="/assessment" 
                  className={`journey-step ${s2Done ? 'completed' : (s1Done ? 'current' : 'upcoming')}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="step-circle">
                    {s2Done ? <CheckCircle2 size={18} /> : '2'}
                  </div>
                  <div className="step-content">
                    <strong className="step-title">{t('dashboard.stage_2_title')}</strong>
                    <span className="step-desc">
                      {workflow?.stage2_assessment?.description || 'Domain competency evaluation'}
                    </span>
                  </div>
                </Link>

                <div className={`journey-connector ${s2Done ? 'active' : ''}`} />

                {/* Stage 3: Skill Gap Analysis */}
                <Link 
                  to="/igot-courses" 
                  className={`journey-step ${s3Done ? 'completed' : (s2Done ? 'current' : 'upcoming')}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="step-circle">
                    {s3Done ? <CheckCircle2 size={18} /> : '3'}
                  </div>
                  <div className="step-content">
                    <strong className="step-title">{t('dashboard.stage_3_title')}</strong>
                    <span className="step-desc">
                      {workflow?.stage3_skillGaps?.description || 'Benchmark delta identification'}
                    </span>
                  </div>
                </Link>

                <div className={`journey-connector ${s3Done ? 'active' : ''}`} />

                {/* Stage 4: Learning / iGOT Reassessment */}
                <Link 
                  to="/reassessment" 
                  className={`journey-step ${s4Done ? 'completed' : (s3Done ? 'current' : 'upcoming')}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="step-circle">
                    {s4Done ? <CheckCircle2 size={18} /> : '4'}
                  </div>
                  <div className="step-content">
                    <strong className="step-title">{t('dashboard.stage_4_title')}</strong>
                    <span className="step-desc">
                      {workflow?.stage4_reassessment?.description || 'Targeted mastery & promotion'}
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* 4. MAIN ASSESSMENT SHOWCASE SECTION */}
          <div className="card assessment-feature-card-full animate-card" style={{ marginBottom: '24px' }}>
            <div className="card-header-clean">
              <div className="header-title-group">
                <span className={`section-pill ${isCycleComplete ? 'badge-green' : ''}`}>
                  {isCycleComplete ? t('dashboard.cycle_completed') : t('dashboard.active_cycle')}
                </span>
                <h3 className="section-heading">{t('dashboard.evaluation_title')}</h3>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link to="/assessment" className="btn btn-primary btn-sm">
                  + {t('dashboard.start_assessment')}
                </Link>
                {latestAssessment && (
                  <Link to="/reassessment" className="btn btn-outline btn-sm">
                    <RefreshCw size={14} /> {t('reassessment.title')}
                  </Link>
                )}
              </div>
            </div>

            {assessmentLoading ? (
              <div className="loading-container">
                <p className="loading-text">{t('system.loading')}</p>
              </div>
            ) : !latestAssessment ? (
              <div className="empty-assessment-notice">
                <div className="empty-notice-icon">🎯</div>
                <h4>{t('dashboard.no_assessment_title')}</h4>
                <p className="muted-sm">
                  {t('dashboard.no_assessment_desc')}
                </p>
                <Link to="/assessment" className="btn btn-primary" style={{ marginTop: '12px' }}>
                  <BrainCircuit size={16} /> {t('dashboard.start_assessment')}
                </Link>
              </div>
            ) : (
              <div className="assessment-dashboard-view">
                {/* Score Showcase Widget */}
                <div className="assessment-score-showcase" style={{ '--score-pct': `${animatedScore}%` }}>
                  <div className="score-ring-box">
                    <div className="score-circular-value">
                      <span className="score-number">{animatedScore}%</span>
                      <span className="score-caption">{t('result.overall_score')}</span>
                    </div>
                  </div>

                  <div className="score-details-column">
                    <div className="score-meta-badge">
                      <span className="meta-label">{t('dashboard.accuracy_label')}</span>
                      <strong className="meta-value">
                        {t('dashboard.questions_correct_of', { correct: latestAssessment.correctAnswers ?? 0, total: latestAssessment.totalQuestions ?? 0 })}
                      </strong>
                    </div>
                    <div className="score-meta-badge">
                      <span className="meta-label">{t('dashboard.completed_on')}</span>
                      <strong className="meta-value">
                        {latestAssessment.completedAt ? new Date(latestAssessment.completedAt).toLocaleDateString() : '—'}
                      </strong>
                    </div>
                    <div className="assessment-actions-row">
                      <Link to="/reassessment" className="btn btn-primary btn-sm">
                        🎯 {t('reassessment.start_reassessment')}
                      </Link>
                      <Link to={`/assessment/result/${latestAssessment.assessmentId}`} className="btn btn-outline btn-sm">
                        <FileText size={14} /> {t('result.title')}
                      </Link>
                      <Link to="/igot-courses" className="btn btn-outline btn-sm">
                        <GraduationCap size={14} /> {t('dashboard.view_igot_courses')}
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Skill Distribution Bars */}
                {latestAssessment.skillScores && latestAssessment.skillScores.length > 0 && (
                  <div className="skill-distribution-section" style={{ marginTop: '20px' }}>
                    <h4 className="scores-subtitle">{t('dashboard.domain_breakdown')}</h4>
                    <div className="skill-score-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                      {latestAssessment.skillScores.map((ss) => (
                        <SkillScoreBar 
                          key={ss.skillId}
                          skillName={typeof ss.skillName === 'object' ? (ss.skillName?.en || Object.values(ss.skillName || {})[0] || 'Competency') : String(ss.skillName || 'Competency')}
                          percentage={ss.percentage}
                          questionsCount={ss.questionsCount}
                          correctCount={ss.correctCount}
                          benchmark={80}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. ACHIEVEMENTS & MILESTONES (GAMIFIED GOV-AESTHETIC) */}
          <div className="card achievements-dashboard-card animate-card">
            <div className="card-header-clean">
              <div className="header-title-group">
                <span className="section-pill success">{t('dashboard.achievements_pill')}</span>
                <h3 className="section-heading">{t('dashboard.achievements_heading')}</h3>
              </div>
              <span className="achievements-note-tag">{t('dashboard.verified_ai')}</span>
            </div>

            <div className="achievements-grid">
              {earnedBadges.map((badge) => (
                <AchievementCard 
                  key={badge.id}
                  icon={badge.icon}
                  title={badge.title}
                  description={badge.description}
                  earned={badge.earned}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
