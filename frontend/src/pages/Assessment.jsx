import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from '../components/LoadingScreen'
import { useTranslation } from 'react-i18next'
import { 
  BrainCircuit, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  Sparkles, 
  Target, 
  UserCheck,
  ArrowRight
} from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function Assessment() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { t } = useTranslation()

  // Start Screen Info
  const [infoLoading, setInfoLoading] = useState(true)
  const [assessmentInfo, setAssessmentInfo] = useState(null)
  
  // Assessment State
  const [started, setStarted] = useState(false)
  const [assessmentId, setAssessmentId] = useState(null)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0) // questions answered so far
  
  // Current Question State
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedOption, setSelectedOption] = useState(null)
  
  // UI status
  const [loadingAction, setLoadingAction] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 1. Fetch info function
  const fetchInfo = useCallback(async () => {
    try {
      setInfoLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${BACKEND_URL}/api/assessment/info`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      const data = await res.json()
      if (data.success) {
        setAssessmentInfo(data)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError(err?.message || t('Failed to fetch assessment info.'))
    } finally {
      setInfoLoading(false)
    }
  }, [t])

  // 2. Finalize Assessment function
  const handleSubmitAssessment = useCallback(async (id) => {
    try {
      setIsSubmitting(true)
      setLoadingAction(true)
      setError('')
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${BACKEND_URL}/api/assessment/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ answers: {} }) // answers already saved incrementally
      })

      const contentType = res.headers.get('content-type') || ''
      if (!res.ok || !contentType.includes('application/json')) {
        const text = await res.text()
        console.error('Submit Assessment Error:', res.status, text)
        throw new Error(`Submission failed (${res.status}): ${text.substring(0, 150)}`)
      }

      const data = await res.json()
      if (!data.success) throw new Error(data.message || data.error || 'Submission error')
      
      navigate(`/assessment/result/${id}`, { replace: true })
    } catch (err) {
      console.error('Submit error:', err)
      setError(err.message || t('Error submitting final assessment'))
      setLoadingAction(false)
      setIsSubmitting(false)
    }
  }, [navigate, t])

  // 3. Fetch Next Question function
  const fetchNextQuestion = useCallback(async (id) => {
    try {
      setLoadingAction(true)
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${BACKEND_URL}/api/assessment/${id}/next-question`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Failed to fetch question')
      
      if (data.complete) {
         await handleSubmitAssessment(id)
         return
      }

      if (!data.question || !data.question.id || !data.question.questionText || !Array.isArray(data.question.options)) {
        throw new Error(t('Received malformed question from server. Please try again.'))
      }
      
      setCurrentQuestion(data.question)
      setSelectedOption(null)
      setCurrentIndex((data.question.questionOrder || 1) - 1)
      setLoadingAction(false)
    } catch (err) {
      setError(err.message || t('Error fetching question'))
      setLoadingAction(false)
    }
  }, [handleSubmitAssessment, t])

  // 3. Start Assessment function
  const handleStart = useCallback(async (type = 'initial') => {
    const finalType = typeof type === 'string' && (type === 'reassessment' || type === 'initial') ? type : 'initial'
    
    setError('')
    setLoadingAction(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const res = await fetch(`${BACKEND_URL}/api/assessment/start-new`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({ assessmentType: finalType })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      
      setAssessmentId(data.assessmentId)
      setTotalQuestions(data.totalQuestions)
      setStarted(true)
      
      await fetchNextQuestion(data.assessmentId)
    } catch (err) {
      setError(err.message || t('Error starting assessment'))
      setLoadingAction(false)
    }
  }, [fetchNextQuestion, t])

  // 4. Fetch info on mount
  useEffect(() => {
    if (!authLoading && user) {
      fetchInfo();
      if (searchParams.get('start') === 'true' && !started) {
        handleStart(searchParams.get('type') || 'reassessment');
      }
    }
  }, [authLoading, user, started, searchParams, fetchInfo, handleStart])

  // 4. Submit Answer & Go Next
  const handleNextQuestion = async () => {
    if (!selectedOption || !currentQuestion?.id || !assessmentId) return;
    
    setError('')
    setLoadingAction(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${BACKEND_URL}/api/assessment/${assessmentId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ questionId: String(currentQuestion.id), selectedAnswer: String(selectedOption) })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      
      if (currentIndex + 1 >= totalQuestions) {
         await handleSubmitAssessment(assessmentId)
      } else {
         await fetchNextQuestion(assessmentId)
      }
    } catch (err) {
      setError(err.message || t('Error submitting answer'))
      setLoadingAction(false)
    }
  }

  if (authLoading || infoLoading) {
    return <LoadingScreen message={t('Loading AI Competency Assessment...')} />
  }

  // START SCREEN
  if (!started) {
    return (
      <div className="assessment-page">
        <div className="page-hero-header">
          <div className="page-hero-content">
            <span className="page-hero-badge">🏛️ Official MoSPI Assessment</span>
            <h1 className="page-hero-title">{t('AI Competency Assessment')}</h1>
            <p className="page-hero-subtitle">
              {t('This adaptive assessment validates your active competencies against your official designation requirements.')}
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ maxWidth: '860px', margin: '0 auto 20px' }}>
            {error}
          </div>
        )}

        <div className="assessment-intro-card">
          <div className="assessment-intro-header">
            <span className="assessment-intro-icon" aria-hidden="true">🎯</span>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
              Adaptive Competency Evaluation
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Calibrated to official Indian Statistical Service (ISS) benchmark standards
            </p>
          </div>

          {assessmentInfo && (
            <div className="assessment-info-grid">
              <div className="assessment-info-box">
                <h3><UserCheck size={18} color="#0284c7" /> {t('Your Profile')}</h3>
                <ul className="assessment-info-list">
                  <li>
                    <span>{t('Designation:')}</span>
                    <strong>{assessmentInfo.designationName}</strong>
                  </li>
                  <li>
                    <span>{t('Current Skills:')}</span>
                    <strong>{assessmentInfo.currentSkills.length} Mapped</strong>
                  </li>
                  <li style={{ flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    {assessmentInfo.currentSkills.map(s => (
                      <span key={s.id} className="course-skill-pill" style={{ fontSize: '11px' }}>
                        {s.name}
                      </span>
                    ))}
                  </li>
                </ul>
              </div>

              <div className="assessment-info-box highlight">
                <h3><Clock size={18} color="#15803d" /> {t('Assessment Details')}</h3>
                <ul className="assessment-info-list">
                  <li>
                    <span>{t('Total Questions:')}</span>
                    <strong>{assessmentInfo.totalQuestions} Questions</strong>
                  </li>
                  <li>
                    <span>{t('Estimated Time:')}</span>
                    <strong>{assessmentInfo.estimatedTime} {t('minutes')}</strong>
                  </li>
                  <li>
                    <span>Adaptive Testing:</span>
                    <strong style={{ color: '#15803d' }}>Active AI Engine</strong>
                  </li>
                  <li>
                    <span>XP Reward:</span>
                    <strong style={{ color: '#ff9933' }}>+1,000 Base XP</strong>
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <button 
              type="button" 
              className="btn btn-primary btn-lg" 
              onClick={() => handleStart('initial')} 
              disabled={loadingAction || !assessmentInfo || assessmentInfo.currentSkills.length === 0}
              style={{ padding: '14px 36px', fontSize: '16px', borderRadius: '10px' }}
            >
              {loadingAction ? t('Initializing Assessment...') : (
                <>
                  <BrainCircuit size={18} /> {t('Start Assessment')}
                </>
              )}
            </button>
            {(!assessmentInfo || assessmentInfo.currentSkills.length === 0) && (
              <p style={{ marginTop: '15px', color: '#dc2626', fontSize: '13.5px' }}>
                {t('You must select your current skills in your Profile first.')}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ACTIVE ASSESSMENT SCREEN
  if (isSubmitting) {
    return <LoadingScreen message={t('Calculating scores, analyzing competency & skill gaps...')} />
  }

  if (loadingAction && !currentQuestion) {
    return <LoadingScreen message={t('Generating next adaptive question...')} />
  }

  if (!currentQuestion) {
    return (
      <div className="assessment-page" style={{ maxWidth: '860px', margin: '40px auto', padding: '0 20px' }}>
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <strong>Notice:</strong> {error || t('No active question found. Please retry or return to dashboard.')}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {assessmentId ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fetchNextQuestion(assessmentId)}
              disabled={loadingAction}
            >
              {loadingAction ? t('Loading...') : t('Retry Question')}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleStart('initial')}
              disabled={loadingAction}
            >
              {t('Start Assessment')}
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/dashboard')}
          >
            {t('dashboard.overview')}
          </button>
        </div>
      </div>
    )
  }

  const progressPct = Math.round(((currentIndex) / totalQuestions) * 100)

  return (
    <div className="assessment-page">
      <div className="page-hero-header">
        <div className="page-hero-content">
          <span className="page-hero-badge">🎯 Active Competency Test</span>
          <h1 className="page-hero-title">{t('AI Competency Assessment')}</h1>
          <p className="page-hero-subtitle">{t('Answer the following question to advance.')}</p>
        </div>
        <div className="gap-priority-pill priority-medium" style={{ fontSize: '13px', padding: '6px 14px' }}>
          {t('Question')} {currentIndex + 1} {t('of')} {totalQuestions}
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert" style={{ maxWidth: '900px', margin: '0 auto 20px' }}>
          <strong>{t('Notice:')}</strong> {error}
        </div>
      )}

      <div className="quiz-active-card">
        {/* Progress bar */}
        <div className="quiz-progress-wrapper">
          <div className="quiz-progress-label">
            <span>{t('Question')} {currentIndex + 1} {t('of')} {totalQuestions}</span>
            <strong>{progressPct}{t('% Complete')}</strong>
          </div>
          <div className="quiz-progress-bar">
            <div className="quiz-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Question Metadata Tags */}
        <div className="quiz-top-meta">
          <span className="quiz-domain-tag">
            <Target size={14} /> {t('Skill:')} <strong>{currentQuestion.skillName}</strong>
          </span>
          <span className={`quiz-difficulty-tag diff-${currentQuestion.difficulty?.toLowerCase() || 'medium'}`}>
            {(currentQuestion.difficulty || 'medium').toUpperCase()} DIFFICULTY
          </span>
        </div>

        {/* Question text */}
        <h2 className="quiz-question-heading">{currentQuestion.questionText}</h2>

        {/* Options List */}
        <div className="quiz-options-list">
          {currentQuestion.options.map((optText, idx) => {
            const optionLetter = String.fromCharCode(65 + idx)
            const isSelected = selectedOption === optText
            return (
              <button
                key={idx}
                type="button"
                className={`quiz-option-item ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedOption(optText)}
                disabled={loadingAction}
              >
                <span className="option-circle-letter">{optionLetter}</span>
                <span className="quiz-option-text">{optText}</span>
              </button>
            )
          })}
        </div>

        {/* Actions Bar */}
        <div className="quiz-actions-bar">
          <button
            type="button"
            className={currentIndex + 1 >= totalQuestions ? "btn btn-primary btn-lg" : "btn btn-primary"}
            onClick={handleNextQuestion}
            disabled={loadingAction || !selectedOption}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            {loadingAction ? (
              t('Processing...')
            ) : currentIndex + 1 >= totalQuestions ? (
              <>
                <CheckCircle2 size={18} /> {t('Submit Assessment')}
              </>
            ) : (
              <>
                {t('Next Question →')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
