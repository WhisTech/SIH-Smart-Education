import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from '../components/LoadingScreen'
import { useTranslation } from 'react-i18next'
import { useProctoring } from '../hooks/useProctoring'
import ProctoringModal from '../components/ProctoringModal'
import ProctoringCameraFeed from '../components/ProctoringCameraFeed'
import { 
  BrainCircuit, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  Sparkles, 
  Target, 
  UserCheck,
  ArrowRight,
  ShieldAlert
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

  // Proctoring & Verification State
  const [isPreCheckOpen, setIsPreCheckOpen] = useState(false)
  const [pendingExamType, setPendingExamType] = useState('initial')

  // Exam Countdown Timer State (in seconds)
  const [timeLeft, setTimeLeft] = useState(null)

  // Initialize Free Browser-Based Proctoring Hook
  const {
    stream,
    cameraStatus,
    cameraError,
    isFullscreen,
    fullscreenError,
    warningCount,
    setWarningCount,
    isTerminated,
    setIsTerminated,
    currentViolation,
    setCurrentViolation,
    isViolationModalOpen,
    setIsViolationModalOpen,
    isModelLoading,
    isModelLoaded,
    faceStatus,
    faceCount,
    requestCameraPermission,
    stopCamera,
    enterFullscreen,
    exitFullscreen,
    dismissWarning,
    pauseProctoring
  } = useProctoring({
    assessmentId,
    proctoringMode: 'STRICT', // STRICT mode enabled by default (Layer A + Layer B Face AI)
    isActive: started && !isSubmitting && !isTerminated,
    onTerminated: (reason) => {
      console.warn('[Proctoring] Assessment cancelled due to violations:', reason)
      exitFullscreen()
      stopCamera()
    }
  })

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
      
      // Pause proctoring monitoring so exiting fullscreen does not trigger false warnings during submit
      pauseProctoring()
      stopCamera()
      exitFullscreen()

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
  }, [navigate, t, stopCamera, exitFullscreen, pauseProctoring])

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
      
      if (!res.ok && data.terminated) {
        throw new Error(data.message || 'Assessment has been terminated.')
      }

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

  // 4. Start Assessment function
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

      // Initialize countdown timer (defaults to estimatedTime minutes or 15 mins)
      const initialMins = assessmentInfo?.estimatedTime || 15
      setTimeLeft(initialMins * 60)
      
      await fetchNextQuestion(data.assessmentId)
    } catch (err) {
      setError(err.message || t('Error starting assessment'))
      setLoadingAction(false)
    }
  }, [fetchNextQuestion, assessmentInfo, t])

  // 5. Pre-Check & Fullscreen Handlers
  const handleOpenPreCheck = (type = 'initial') => {
    setPendingExamType(type)
    setIsPreCheckOpen(true)
  }

  const handleConfirmStartExam = async () => {
    try {
      setLoadingAction(true)
      const ok = await enterFullscreen()
      if (!ok) {
        setLoadingAction(false)
        return
      }

      if (assessmentId) {
        // Session already exists! Resume it instead of creating a duplicate attempt
        setStarted(true)
        setIsPreCheckOpen(false)
        const initialMins = assessmentInfo?.estimatedTime || 15
        setTimeLeft(initialMins * 60)
        await fetchNextQuestion(assessmentId)
      } else {
        await handleStart(pendingExamType)
        setIsPreCheckOpen(false)
      }
    } catch (err) {
      console.error('Failed to start assessment:', err)
      setError(err.message || t('Error starting assessment'))
      setLoadingAction(false)
    }
  }

  // 6. Active Exam Countdown Timer Effect
  useEffect(() => {
    if (!started || isSubmitting || isTerminated || timeLeft === null) return

    if (timeLeft <= 0) {
      if (assessmentId) {
        handleSubmitAssessment(assessmentId)
      }
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [started, isSubmitting, isTerminated, timeLeft, assessmentId, handleSubmitAssessment])

  // 7. Fetch info on mount & restore active or terminated sessions
  useEffect(() => {
    let isMounted = true

    const checkActiveSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) return

        const res = await fetch(`${BACKEND_URL}/api/assessment/active-session`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (isMounted && data.success && data.hasActiveSession && data.assessment) {
          const a = data.assessment
          setAssessmentId(a.id)
          setWarningCount(a.warning_count || 0)
          
          if (a.status === 'terminated') {
            setIsPreCheckOpen(false)
            setStarted(true)
            setIsTerminated(true)
            setCurrentViolation({
              type: a.termination_reason || 'TAB_SWITCH',
              warningNumber: 3,
              message: 'Assessment was terminated due to proctoring violations.'
            })
          } else if (a.status === 'in_progress') {
            setTotalQuestions(a.total_questions || 6)
            setPendingExamType(a.assessment_type || 'initial')
            // Re-open precheck to verify camera & fullscreen on reload
            setIsPreCheckOpen(true)
          }
        }
      } catch (err) {
        console.warn('Active session check error:', err)
      }
    }

    if (!authLoading && user) {
      fetchInfo()
      checkActiveSession()

      const typeParam = searchParams.get('type')
      const startParam = searchParams.get('start')
      if (typeParam === 'reassessment' || startParam === 'true') {
        setPendingExamType('reassessment')
        setIsPreCheckOpen(true)
      }
    }

    return () => {
      isMounted = false
    }
  }, [authLoading, user, searchParams, fetchInfo, setWarningCount, setIsTerminated, setCurrentViolation])

  // 8. Submit Answer & Go Next
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
            <span className="page-hero-badge">🏛️ {t('Official MoSPI Assessment')}</span>
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
              {t('Adaptive Competency Evaluation')}
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              {t('Calibrated to official Indian Statistical Service (ISS) benchmark standards')}
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
                    <strong>{assessmentInfo.currentSkills.length} {t('Mapped')}</strong>
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
                    <strong>{assessmentInfo.totalQuestions} {t('Questions')}</strong>
                  </li>
                  <li>
                    <span>{t('Estimated Time:')}</span>
                    <strong>{assessmentInfo.estimatedTime} {t('minutes')}</strong>
                  </li>
                  <li>
                    <span>{t('Adaptive Testing:')}</span>
                    <strong style={{ color: '#15803d' }}>{t('Active AI Engine')}</strong>
                  </li>
                  <li>
                    <span>{t('XP Reward:')}</span>
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
              onClick={() => handleOpenPreCheck('initial')} 
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

        {/* Pre-Exam Verification Modal (Camera Permission + Fullscreen) */}
        <ProctoringModal
          mode="pre_check"
          proctoringMode="STRICT"
          isOpen={isPreCheckOpen}
          stream={stream}
          cameraStatus={cameraStatus}
          cameraError={cameraError}
          fullscreenError={fullscreenError}
          isModelLoading={isModelLoading}
          isModelLoaded={isModelLoaded}
          faceStatus={faceStatus}
          faceCount={faceCount}
          onRequestCamera={requestCameraPermission}
          onStartExam={handleConfirmStartExam}
        />
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
          <strong>{t('Notice:')}</strong> {error || t('No active question found. Please retry or return to dashboard.')}
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
              onClick={() => handleOpenPreCheck('initial')}
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
          <span className="page-hero-badge">🎯 {t('Active Competency Test')}</span>
          <h1 className="page-hero-title">{t('AI Competency Assessment')}</h1>
          <p className="page-hero-subtitle">{t('Answer the following question to advance.')}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Active Exam Countdown Timer Pill */}
          {timeLeft !== null && (
            <div className={`exam-countdown-pill ${timeLeft < 180 ? 'urgent' : ''}`} title="Time Remaining">
              <Clock size={15} />
              <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
            </div>
          )}
          
          <div className="gap-priority-pill priority-medium" style={{ fontSize: '13px', padding: '6px 14px' }}>
            {t('Question')} {currentIndex + 1} {t('of')} {totalQuestions}
          </div>
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
            {(currentQuestion.difficulty || 'medium').toUpperCase()} {t('DIFFICULTY')}
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

      {/* Floating Live Proctoring Camera Feed */}
      {started && !isTerminated && (
        <ProctoringCameraFeed
          stream={stream}
          warningCount={warningCount}
          cameraStatus={cameraStatus}
          faceStatus={faceStatus}
          faceCount={faceCount}
          proctoringMode="STRICT"
        />
      )}

      {/* Pre-Exam Verification Modal (Camera Permission + Fullscreen) */}
      <ProctoringModal
        mode="pre_check"
        proctoringMode="STRICT"
        isOpen={isPreCheckOpen}
        stream={stream}
        cameraStatus={cameraStatus}
        cameraError={cameraError}
        fullscreenError={fullscreenError}
        isModelLoading={isModelLoading}
        isModelLoaded={isModelLoaded}
        faceStatus={faceStatus}
        faceCount={faceCount}
        onRequestCamera={requestCameraPermission}
        onStartExam={handleConfirmStartExam}
      />

      {/* Warning 1 & Warning 2 Modal */}
      <ProctoringModal
        mode="warning"
        proctoringMode="STRICT"
        isOpen={isViolationModalOpen && !isTerminated}
        warningCount={warningCount}
        violationType={currentViolation?.type || 'TAB_SWITCH'}
        onDismissWarning={dismissWarning}
      />

      {/* Termination Modal (Warning 3 Reached) */}
      <ProctoringModal
        mode="terminated"
        proctoringMode="STRICT"
        isOpen={isTerminated}
        violationType={currentViolation?.type || 'TAB_SWITCH'}
        onExitExam={() => {
          exitFullscreen()
          stopCamera()
          navigate('/dashboard')
        }}
      />
    </div>
  )
}
