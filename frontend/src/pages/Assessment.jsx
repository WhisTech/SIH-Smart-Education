import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from '../components/LoadingScreen'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function Assessment() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading } = useAuth()

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
    } catch {
      setError('Failed to fetch assessment info.')
    } finally {
      setInfoLoading(false)
    }
  }, [])

  // 2. Finalize Assessment function
  const handleSubmitAssessment = useCallback(async (id) => {
    try {
      setLoadingAction(true)
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
      setError(err.message || 'Error submitting final assessment')
      setLoadingAction(false)
    }
  }, [navigate])

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
      if (!data.success) throw new Error(data.message)
      
      if (data.complete) {
         await handleSubmitAssessment(id)
         return
      }

      // Validate question structure before updating state
      if (!data.question || !data.question.id || !data.question.questionText || !Array.isArray(data.question.options)) {
        throw new Error('Received malformed question from server. Please try again.')
      }
      
      setCurrentQuestion(data.question)
      setSelectedOption(null)
      setCurrentIndex((data.question.questionOrder || 1) - 1)
      setLoadingAction(false)
    } catch (err) {
      setError(err.message || 'Error fetching question')
      setLoadingAction(false)
    }
  }, [handleSubmitAssessment])

  // 3. Start Assessment function
  const handleStart = useCallback(async (type = 'initial') => {
    // Sanitize type so React synthetic events are NEVER passed as type
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
      
      // Fetch first question immediately
      await fetchNextQuestion(data.assessmentId)
    } catch (err) {
      setError(err.message || 'Error starting assessment')
      setLoadingAction(false)
    }
  }, [fetchNextQuestion])

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
      
      // If we reached the end
      if (currentIndex + 1 >= totalQuestions) {
         await handleSubmitAssessment(assessmentId)
      } else {
         await fetchNextQuestion(assessmentId)
      }
    } catch (err) {
      setError(err.message || 'Error submitting answer')
      setLoadingAction(false)
    }
  }



  if (authLoading || infoLoading) {
    return <LoadingScreen message="Loading AI Competency Assessment..." />
  }

  // START SCREEN
  if (!started) {
    return (
      <div className="assessment-page">
        <div className="card start-screen-card" style={{ maxWidth: '800px', margin: '40px auto', padding: '40px' }}>
          <h1 className="page-title" style={{ textAlign: 'center', marginBottom: '10px' }}>AI Competency Assessment</h1>
          <p className="page-subtitle" style={{ textAlign: 'center', marginBottom: '40px' }}>
            This adaptive assessment validates your active competencies against your official designation requirements.
          </p>
          
          {error && <div className="alert alert-error">{error}</div>}
          
          {assessmentInfo && (
            <div className="assessment-info-grid" style={{ display: 'grid', gap: '20px', marginBottom: '40px' }}>
               <div className="info-box" style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
                  <h3>Your Profile</h3>
                  <p><strong>Designation:</strong> {assessmentInfo.designationName}</p>
                  <p><strong>Current Skills:</strong> {assessmentInfo.currentSkills.map(s => s.name).join(', ') || 'None'}</p>
               </div>
               
               <div className="info-box" style={{ background: '#f0fdf4', padding: '20px', borderRadius: '8px' }}>
                  <h3>Assessment Details</h3>
                  <p><strong>Total Questions:</strong> {assessmentInfo.totalQuestions}</p>
                  <p><strong>Estimated Time:</strong> {assessmentInfo.estimatedTime} minutes</p>
                  <p><strong>Adaptive Difficulty:</strong> Yes, adjusts based on your performance.</p>
               </div>
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <button 
               type="button" 
               className="btn btn-primary btn-lg" 
               onClick={() => handleStart('initial')} 
               disabled={loadingAction || !assessmentInfo || assessmentInfo.currentSkills.length === 0}
            >
               {loadingAction ? 'Initializing Assessment...' : 'Start Assessment'}
            </button>
            {(!assessmentInfo || assessmentInfo.currentSkills.length === 0) && (
               <p style={{ marginTop: '15px', color: '#dc2626' }}>You must select your current skills in your Profile first.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ACTIVE ASSESSMENT SCREEN
  if (loadingAction && !currentQuestion) {
     return <LoadingScreen message="Generating next adaptive question..." />
  }

  if (!currentQuestion) return null;

  const progressPct = Math.round(((currentIndex) / totalQuestions) * 100)

  return (
    <div className="assessment-page">
      <div className="assessment-header-box">
        <div>
          <h1 className="page-title">AI Competency Assessment</h1>
          <p className="page-subtitle">Answer the following question to advance.</p>
        </div>
        <div className="quiz-counter-pill">
          Question {currentIndex + 1} of {totalQuestions}
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <strong>Notice:</strong> {error}
        </div>
      )}

      <div className="card quiz-card">
        <div className="progress-container">
          <div className="progress-label-row">
            <span className="progress-step-text">Question {currentIndex + 1} of {totalQuestions}</span>
            <span className="progress-pct-text">{progressPct}% Complete</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="quiz-meta-row">
          <span className="quiz-skill-tag">
            Skill: <strong>{currentQuestion.skillName}</strong>
          </span>
          <span className={`quiz-diff-tag diff-${currentQuestion.difficulty || 'medium'}`}>
            {(currentQuestion.difficulty || 'medium').toUpperCase()}
          </span>
        </div>

        <h2 className="quiz-question-text">{currentQuestion.questionText}</h2>

        <div className="quiz-options-grid">
          {currentQuestion.options.map((optText, idx) => {
            const optionLetter = String.fromCharCode(65 + idx)
            const isSelected = selectedOption === optText
            return (
              <button
                key={idx}
                type="button"
                className={`quiz-option-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedOption(optText)}
                disabled={loadingAction}
              >
                <span className="option-badge">{optionLetter}</span>
                <span className="option-text">{optText}</span>
              </button>
            )
          })}
        </div>

        <div className="quiz-footer-nav" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className={currentIndex + 1 >= totalQuestions ? "btn btn-success btn-lg" : "btn btn-primary"}
            onClick={handleNextQuestion}
            disabled={loadingAction || !selectedOption}
          >
            {loadingAction ? 'Processing...' : (currentIndex + 1 >= totalQuestions ? 'Submit Assessment' : 'Next Question →')}
          </button>
        </div>
      </div>
    </div>
  )
}
