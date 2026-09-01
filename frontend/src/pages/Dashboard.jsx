import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { fetchDesignations, fetchSkills } from '../lib/referenceData'
import LoadingScreen from '../components/LoadingScreen'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function Dashboard() {
  const { user, profile, profileLoading } = useAuth()

  const [designations, setDesignations] = useState([])
  const [employeeSkills, setEmployeeSkills] = useState([])
  const [skillsLoading, setSkillsLoading] = useState(true)

  // Latest Assessment state
  const [latestAssessment, setLatestAssessment] = useState(null)
  const [assessmentLoading, setAssessmentLoading] = useState(true)

  // Load designations for UUID lookup
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

  // Load employee's skills and latest assessment from backend
  useEffect(() => {
    let isMounted = true

    const loadDashboardData = async () => {
      if (!profile?.id) {
        if (isMounted) {
          setSkillsLoading(false)
          setAssessmentLoading(false)
        }
        return
      }

      setSkillsLoading(true)
      setAssessmentLoading(true)

      try {
        // 1. Load Employee Skills
        const { data: empSkillRows, error: esErr } = await supabase
          .from('employee_skills')
          .select('skill_id')
          .eq('employee_profile_id', profile.id)

        if (!esErr && empSkillRows && empSkillRows.length > 0) {
          const skillIds = empSkillRows.map((r) => r.skill_id)
          const { data: skillData } = await supabase
            .from('skills')
            .select('id, name, category')
            .in('id', skillIds)

          if (isMounted) {
            if (skillData && skillData.length > 0) {
              setEmployeeSkills(skillData)
            } else {
              const allRef = await fetchSkills()
              const matched = (allRef.data || []).filter((s) => skillIds.includes(s.id))
              setEmployeeSkills(matched)
            }
          }
        } else if (isMounted) {
          setEmployeeSkills([])
        }
      } catch (err) {
        console.error('Error loading dashboard skills:', err)
      } finally {
        if (isMounted) setSkillsLoading(false)
      }

      // 2. Load Latest Assessment from Backend
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        if (token) {
          const res = await fetch(`${BACKEND_URL}/api/assessment/user/latest`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const result = await res.json()
          if (isMounted && result.success) {
            setLatestAssessment(result.latestAssessment)
          }
        }
      } catch (err) {
        console.error('Error loading latest assessment:', err)
      } finally {
        if (isMounted) setAssessmentLoading(false)
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [profile?.id])

  if (profileLoading) {
    return <LoadingScreen message="Loading official dashboard..." />
  }

  // Lookup designation name
  const designationName =
    designations.find((d) => d.id === profile?.designation_id)?.name ||
    profile?.designation_id ||
    '—'

  const firstInitial =
    profile?.name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'O'

  return (
    <div className="dashboard">
      {/* Official Top Banner */}
      <div className="dashboard-header">
        <div className="avatar" aria-hidden="true">{firstInitial}</div>
        <div className="dashboard-header-info">
          <h1>{profile?.name || 'Welcome, Official'}</h1>
          <p className="muted">
            {user?.email} · {profile?.department || 'Official Statistical System'}
          </p>
        </div>
      </div>

      {!profile ? (
        <div className="empty-state">
          <span className="brand-emblem large">⚠️</span>
          <h2>Employee Profile Not Found</h2>
          <p>
            We could not find an employee profile linked to your authenticated account. Please contact
            your administrator or set up your profile details.
          </p>
          <Link to="/profile" className="btn btn-primary">
            Set Up Profile
          </Link>
        </div>
      ) : (
        <>
          <div className="section-title">
            <h2>Employee Overview</h2>
            <Link to="/profile" className="btn btn-outline btn-sm">
              View / Edit Profile
            </Link>
          </div>

          {/* Quick Statistics Grid */}
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-label">Employee ID</span>
              <span className="stat-value"><code>{profile.employee_id || '—'}</code></span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Official Designation</span>
              <span className="stat-value">{designationName}</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Department / Division</span>
              <span className="stat-value">{profile.department || '—'}</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Experience</span>
              <span className="stat-value">
                {profile.experience_years != null ? `${profile.experience_years} Years` : '—'}
              </span>
            </div>
          </div>

          {/* FEATURE 10: AI COMPETENCY ASSESSMENT DASHBOARD SECTION */}
          <div className="card assessment-dashboard-card">
            <div className="section-title-sm">
              <h3 className="card-section-title">AI Competency Assessment</h3>
              <Link to="/assessment" className="btn btn-primary btn-sm">
                + Start Assessment
              </Link>
            </div>

            {assessmentLoading ? (
              <p className="loading-text">Loading assessment data...</p>
            ) : !latestAssessment ? (
              <div className="empty-assessment-notice">
                <p>No assessment completed yet.</p>
                <p className="muted-sm">
                  Take the AI competency assessment to evaluate your current proficiency across your active skills.
                </p>
                <Link to="/assessment" className="btn btn-primary">
                  Start Your First Assessment
                </Link>
              </div>
            ) : (
              <div className="latest-assessment-summary">
                <div className="latest-score-banner">
                  <div className="score-main-box">
                    <span className="score-label">Latest Score</span>
                    <span className="score-big">{Math.round(latestAssessment.overallScore)}%</span>
                  </div>
                  <div className="score-meta">
                    <span className="meta-item">
                      Completed: <strong>{new Date(latestAssessment.completedAt).toLocaleDateString()}</strong>
                    </span>
                    <span className="meta-item">
                      Accuracy: <strong>{latestAssessment.correctAnswers} / {latestAssessment.totalQuestions} Questions</strong>
                    </span>
                  </div>
                  <div className="banner-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link
                      to="/reassessment"
                      className="btn btn-primary btn-sm"
                    >
                      🎯 Start Reassessment
                    </Link>
                    <Link
                      to={`/assessment/result/${latestAssessment.assessmentId}`}
                      className="btn btn-outline btn-sm"
                    >
                      View Assessment Result
                    </Link>
                  </div>
                </div>

                {latestAssessment.skillScores && latestAssessment.skillScores.length > 0 && (
                  <div className="dashboard-skill-scores-grid">
                    <h4 className="scores-subtitle">Skill Performance Breakdown:</h4>
                    <div className="skill-bars-list">
                      {latestAssessment.skillScores.map((ss) => (
                        <div key={ss.skillId} className="dashboard-skill-bar-row">
                          <span className="bar-skill-name">{ss.skillName}</span>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: `${ss.percentage}%` }} />
                          </div>
                          <span className="bar-pct">{ss.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Current Skills Summary Card */}
          <div className="card">
            <div className="section-title-sm">
              <h3 className="card-section-title">Current Mapped Skills</h3>
              <Link to="/profile" className="link-sm">
                Manage Skills
              </Link>
            </div>

            {skillsLoading ? (
              <p className="loading-text">Loading skills...</p>
            ) : employeeSkills.length === 0 ? (
              <div className="empty-skills-notice">
                <p>No skills recorded yet. Add your current statistical competencies.</p>
                <Link to="/profile" className="btn btn-outline btn-sm">
                  + Add Skills in Profile
                </Link>
              </div>
            ) : (
              <div className="dashboard-skills-chips">
                {employeeSkills.map((skill) => (
                  <span key={skill.id} className="skill-chip-view">
                    <span className="chip-cat-tag">{skill.category || 'Skill'}</span>
                    <span className="chip-label">{skill.name}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Workflow Status Info Card */}
          <div className="card info-card">
            <h3>Stage 2 Active: AI Competency Assessment</h3>
            <p>
              Stage 1 (Profile &amp; Skills) and Stage 2 (AI Competency Assessment) are fully operational.
              Complete assessments to unlock personalized learning paths in Stage 3.
            </p>
            <div className="workflow-steps-indicator">
              <span className="step-pill active">✓ 1. Profile &amp; Skills</span>
              <span className="step-pill active">✓ 2. AI Assessment</span>
              <span className="step-pill">3. Skill-Gap Analysis</span>
              <span className="step-pill">4. iGOT / NSSTA Learning</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
