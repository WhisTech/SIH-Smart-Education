import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LoadingScreen from '../components/LoadingScreen'
import { useTranslation } from 'react-i18next'

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

      // Navigate to assessment test interface with the active attempt
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
    <div className="reassessment-page" style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px' }}>
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <h1 className="page-title" style={{ fontSize: '1.8rem', color: '#1e293b' }}>
          🎯 AI Competency Reassessment
        </h1>
        <p className="page-subtitle" style={{ color: '#64748b', fontSize: '1rem' }}>
          Validate skill improvements after completing recommended learning modules and update your official competency profile for <strong>{info?.designationName}</strong>.
        </p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* Card 1: Previous Performance */}
        <div className="card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📈</span> Previous Assessment Summary
          </h2>
          
          {info?.hasPreviousAssessment && info?.previousAssessment ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '15px', marginBottom: '15px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2563eb' }}>
                  {Math.round(info.previousAssessment.overallScore)}%
                </span>
                <span style={{ color: '#64748b', fontSize: '0.95rem' }}>
                  Overall Competency Score
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.8' }}>
                <div><strong>Completed on:</strong> {new Date(info.previousAssessment.completedAt).toLocaleDateString()}</div>
                <div><strong>Accuracy:</strong> {info.previousAssessment.correctAnswers} of {info.previousAssessment.totalQuestions} questions correct</div>
                <div><strong>Attempt ID:</strong> <code style={{ fontSize: '0.8em', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{info.previousAssessment.id.substring(0, 8)}...</code></div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px 0', color: '#64748b' }}>
              <p>No previous assessment on record. This reassessment will establish your baseline competency score.</p>
            </div>
          )}
        </div>

        {/* Card 2: Reassessment Parameters */}
        <div className="card" style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚙️</span> Reassessment Parameters
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: '2' }}>
            <li><strong>Total Questions:</strong> {info?.totalQuestions || 6} Questions</li>
            <li><strong>Estimated Time:</strong> ~{Math.round(info?.estimatedTime || 10)} Minutes</li>
            <li><strong>Difficulty:</strong> Adaptive (Calibrated against your previous answers)</li>
            <li><strong>Target Role:</strong> {info?.designationName}</li>
            <li><strong>Zero Duplicate Guarantee:</strong> Genuinely new questions tested against your full history</li>
          </ul>
        </div>
      </div>

      {/* Card 3: Skill Gaps Target Section */}
      <div className="card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '10px', color: '#0f172a' }}>
          📊 Target Skill Gaps to Close
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '20px' }}>
          Your performance will be evaluated against the required proficiency standards for each official competency.
        </p>

        {info?.skillGaps && info.skillGaps.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {info.skillGaps.map((g) => {
              const isMet = g.assessedScore >= g.requiredScore
              const gapVal = Math.max(0, g.requiredScore - g.assessedScore)
              const badgeColor = isMet ? '#16a34a' : gapVal <= 15 ? '#ca8a04' : '#dc2626'
              const badgeText = isMet ? '✓ Requirement Met' : gapVal <= 15 ? '⚠ Needs Improvement' : '🚨 High Priority Gap'

              return (
                <div key={g.id || g.skillId} style={{ padding: '16px', background: isMet ? '#f0fdf4' : '#fff', borderRadius: '8px', border: `1px solid ${isMet ? '#bbf7d0' : '#e2e8f0'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', fontSize: '1rem', color: '#1e293b' }}>{g.skillName}</span>
                    <span style={{ color: badgeColor, fontWeight: '600', fontSize: '0.85rem', background: isMet ? '#dcfce7' : '#fee2e2', padding: '4px 10px', borderRadius: '12px' }}>
                      {badgeText}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', marginBottom: '6px' }}>
                    <span>Previous Score: <strong>{g.assessedScore}%</strong></span>
                    <span>Required Standard: <strong>{g.requiredScore}%</strong></span>
                    <span>Remaining Gap: <strong>{gapVal}%</strong></span>
                  </div>

                  {/* Progress track */}
                  <div style={{ position: 'relative', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${g.requiredScore}%`, width: '2px', background: '#000', zIndex: 5 }} title="Required Standard" />
                    <div style={{ width: `${g.assessedScore}%`, height: '100%', background: badgeColor, borderRadius: '5px' }} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>No active skill gaps recorded. Start reassessment to establish your competencies.</p>
        )}
      </div>

      {/* Card 4: Recommended Modules Review */}
      {info?.recommendedCourses && info.recommendedCourses.length > 0 && (
        <div className="card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '10px', color: '#0f172a' }}>
            📚 Associated iGOT Learning Modules
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '15px' }}>
            Courses identified to close the competency gaps above before testing:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
            {info.recommendedCourses.slice(0, 4).map((c) => (
              <div key={c.id || c.courseId} style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#0f172a' }}>{c.title}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Provider: {c.provider} · Skill: <strong>{c.skillName}</strong></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA Card */}
      <div className="card" style={{ padding: '30px', textAlign: 'center', background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', borderRadius: '12px', color: '#fff' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '10px' }}>
          Ready to Take Your Reassessment?
        </h2>
        <p style={{ color: '#bfdbfe', maxWidth: '600px', margin: '0 auto 24px auto', fontSize: '1rem' }}>
          A new assessment attempt will be created with fresh adaptive questions. Your updated scores will recalculate your skill gaps and update your official recommendations.
        </p>

        <button
          type="button"
          onClick={handleStartReassessment}
          disabled={starting || !info || info.totalQuestions === 0}
          className="btn btn-lg"
          style={{
            background: '#ffffff',
            color: '#1e3a8a',
            fontWeight: 'bold',
            padding: '14px 32px',
            fontSize: '1.1rem',
            borderRadius: '8px',
            border: 'none',
            cursor: starting ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
          }}
        >
          {starting ? 'Initializing Reassessment...' : '🚀 Start Reassessment Now'}
        </button>
      </div>
    </div>
  )
}
