import { useState, useRef } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function McqGenerator() {
  // 1. File & Configuration State
  const [selectedFile, setSelectedFile] = useState(null)
  const [questionCount, setQuestionCount] = useState(5)
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  // 2. Generation & Request State
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  // 3. Quiz Mode State (Evaluation data stored internally, hidden until submitted)
  const [quizData, setQuizData] = useState(null)
  const [userAnswers, setUserAnswers] = useState({}) // { [qIndex]: 'A'|'B'|'C'|'D' }
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [viewMode, setViewMode] = useState('single') // 'single' card or 'all' list
  const [copied, setCopied] = useState(false)

  // Handle PDF File Selection and Validation
  const handleFileChange = (file) => {
    setError('')
    if (!file) return

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file. Other file formats are not supported.')
      return
    }

    const maxSizeBytes = 15 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds 15MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller document.`)
      return
    }

    if (file.size === 0) {
      setError('The selected file is empty (0 bytes). Please choose a valid PDF document.')
      return
    }

    setSelectedFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Generate MCQs from PDF (Controlled Gemini API Call)
  const handleGenerate = async () => {
    if (isGenerating) return

    if (!selectedFile) {
      setError('Please upload a PDF document first before generating MCQs.')
      return
    }

    try {
      setIsGenerating(true)
      setError('')
      setQuizData(null)
      setUserAnswers({})
      setIsSubmitted(false)
      setActiveQuestionIndex(0)

      const formData = new FormData()
      formData.append('pdf', selectedFile)
      formData.append('count', questionCount.toString())
      formData.append('difficulty', difficulty)

      const response = await fetch(`${BACKEND_URL}/api/mcq/generate`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to generate MCQs from the document.')
      }

      setQuizData(data)
    } catch (err) {
      console.error('Error generating MCQs:', err)
      setError(err.message || 'Failed to generate MCQs. Please verify the PDF format and try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Quiz Interaction Handlers (Purely Local - Zero AI Calls)
  const handleSelectOption = (questionIndex, optionKey) => {
    if (isSubmitted) return // Answers locked after submission
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionKey
    }))
  }

  const handleSubmitQuiz = () => {
    if (!quizData?.mcqs || quizData.mcqs.length === 0) return
    setIsSubmitted(true)
    setActiveQuestionIndex(0)
  }

  const handleRetakeQuiz = () => {
    setUserAnswers({})
    setIsSubmitted(false)
    setActiveQuestionIndex(0)
  }

  const handleResetAll = () => {
    setQuizData(null)
    setUserAnswers({})
    setIsSubmitted(false)
    setSelectedFile(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCopyReview = () => {
    if (!quizData?.mcqs) return
    const reviewData = quizData.mcqs.map((q, idx) => {
      const userAns = userAnswers[idx] || 'Not Answered'
      const isCorrect = userAns === q.correctAnswer
      return {
        questionNumber: idx + 1,
        question: q.question,
        options: q.options,
        userAnswer: userAns,
        correctAnswer: q.correctAnswer,
        status: isCorrect ? 'CORRECT' : 'INCORRECT',
        explanation: q.explanation,
        sourcePage: q.sourcePage
      }
    })
    navigator.clipboard.writeText(JSON.stringify(reviewData, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // Local Deterministic Scoring
  const calculateScore = () => {
    if (!quizData?.mcqs) return { total: 0, correct: 0, incorrect: 0, unanswered: 0, percentage: 0 }
    const total = quizData.mcqs.length
    let correct = 0
    let unanswered = 0

    quizData.mcqs.forEach((q, idx) => {
      const ans = userAnswers[idx]
      if (!ans) {
        unanswered++
      } else if (ans === q.correctAnswer) {
        correct++
      }
    })

    const incorrect = total - correct - unanswered
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0

    return { total, correct, incorrect, unanswered, percentage }
  }

  const scoreStats = isSubmitted ? calculateScore() : null
  const answeredCount = Object.keys(userAnswers).length
  const totalQuestionsCount = quizData?.mcqs?.length || 0

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="mcq-page">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <div className="page-tag">
            <span className="sparkle-icon">✨</span> Gemini AI Powered
          </div>
          <h1 className="page-title">AI MCQ Generator &amp; Quiz</h1>
          <p className="page-subtitle">
            Upload any statistical report, manual, or policy document in PDF to generate verified questions, test your comprehension in Quiz Mode, and inspect detailed grounding explanations.
          </p>
        </div>
        {quizData && (
          <button type="button" className="btn btn-outline" onClick={handleResetAll}>
            Upload New Document
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-box alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <strong>Generation Notice:</strong> {error}
          </div>
          <button type="button" className="alert-close" onClick={() => setError('')} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      {/* Generator Configuration Panel (Shown when not in quiz or for new generation) */}
      {!quizData && (
        <div className="card generator-panel">
          <div className="generator-grid">
            
            {/* Left Column: PDF File Dropzone */}
            <div className="generator-col">
              <label className="section-label">1. Upload Source PDF</label>
              
              {!selectedFile ? (
                <div
                  className={`dropzone ${isDragging ? 'dragging' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                    accept=".pdf,application/pdf"
                    style={{ display: 'none' }}
                  />
                  <div className="dropzone-icon">📄</div>
                  <div className="dropzone-title">Click to upload or drag &amp; drop PDF</div>
                  <div className="dropzone-help">Supports searchable PDF files up to 15MB</div>
                </div>
              ) : (
                <div className="file-preview-card">
                  <div className="file-info">
                    <span className="file-icon">📑</span>
                    <div className="file-details">
                      <span className="file-name" title={selectedFile.name}>{selectedFile.name}</span>
                      <span className="file-meta">{formatFileSize(selectedFile.size)} · Ready for analysis</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost file-remove-btn"
                    onClick={handleRemoveFile}
                    disabled={isGenerating}
                    title="Remove file"
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Settings & Action */}
            <div className="generator-col">
              <label className="section-label">2. Configure Generation</label>
              
              <div className="config-group">
                <span className="config-label">Number of Questions</span>
                <div className="pill-group">
                  {[5, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`pill-btn ${questionCount === num ? 'active' : ''}`}
                      onClick={() => setQuestionCount(num)}
                      disabled={isGenerating}
                    >
                      {num} MCQs
                    </button>
                  ))}
                </div>
              </div>

              <div className="config-group">
                <span className="config-label">Difficulty Level</span>
                <div className="pill-group">
                  {[
                    { key: 'EASY', label: 'Easy' },
                    { key: 'MEDIUM', label: 'Medium' },
                    { key: 'HARD', label: 'Hard' }
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`pill-btn ${difficulty === item.key ? 'active' : ''}`}
                      onClick={() => setDifficulty(item.key)}
                      disabled={isGenerating}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="action-row">
                <button
                  type="button"
                  className="btn btn-primary btn-generate"
                  onClick={handleGenerate}
                  disabled={!selectedFile || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <span className="spinner-sm" aria-hidden="true"></span>
                      Synthesizing Questions with Gemini AI...
                    </>
                  ) : (
                    <>
                      <span>✨</span> Generate MCQs
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="card loading-card">
          <div className="loading-spinner-large"></div>
          <h3 className="loading-title">Generating Grounded Questions...</h3>
          <p className="loading-desc">
            Gemini is processing your PDF document, extracting page text, and crafting verified questions with 4 distinct options and source citations.
          </p>
          <div className="loading-steps">
            <span className="step-badge">1. Parsing Document</span>
            <span className="step-arrow">→</span>
            <span className="step-badge active">2. Gemini Processing</span>
            <span className="step-arrow">→</span>
            <span className="step-badge">3. Quality Validation</span>
          </div>
        </div>
      )}

      {/* Empty State Guide */}
      {!isGenerating && !quizData && (
        <div className="card empty-guide-card">
          <div className="guide-header">
            <h3>How AI MCQ Quiz Generator Works</h3>
            <p>Interactive self-assessment grounded strictly in your official documents</p>
          </div>
          <div className="guide-grid">
            <div className="guide-item">
              <span className="guide-icon">🎯</span>
              <h4>100% Document Grounded</h4>
              <p>Questions are synthesized strictly from the uploaded PDF text without external hallucination.</p>
            </div>
            <div className="guide-item">
              <span className="guide-icon">📝</span>
              <h4>Interactive Quiz Mode</h4>
              <p>Answer questions at your own pace without spoilers. Answers and explanations are revealed after submission.</p>
            </div>
            <div className="guide-item">
              <span className="guide-icon">📖</span>
              <h4>Source Page Citations</h4>
              <p>Review detailed explanations and verified PDF page numbers for every single question.</p>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          PHASE 1: ACTIVE QUIZ MODE (Answers & Explanations are HIDDEN)
          ==================================================================== */}
      {quizData && !isSubmitted && (
        <div className="quiz-active-container">
          
          {/* Quiz Status Header */}
          <div className="card quiz-control-header">
            <div className="quiz-control-left">
              <span className="quiz-mode-pill">📝 Active Quiz Mode</span>
              <h2 className="quiz-doc-title">
                {quizData.filename}
              </h2>
              <p className="quiz-doc-meta">
                {totalQuestionsCount} Questions · Difficulty: <strong>{quizData.difficulty}</strong> · {answeredCount} of {totalQuestionsCount} Answered
              </p>
            </div>

            <div className="quiz-control-right">
              <button
                type="button"
                className="btn btn-success btn-submit-quiz"
                onClick={handleSubmitQuiz}
                title="Submit your answers to calculate score"
              >
                ✓ Submit Quiz ({answeredCount}/{totalQuestionsCount})
              </button>
            </div>
          </div>

          {/* Question Nav Tabs */}
          <div className="card mcq-interactive-card">
            <div className="question-nav-tabs">
              {quizData.mcqs.map((_, idx) => {
                const isAnswered = userAnswers[idx] !== undefined
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`nav-tab-btn ${activeQuestionIndex === idx ? 'active' : ''} ${isAnswered ? 'answered-tab' : ''}`}
                    onClick={() => setActiveQuestionIndex(idx)}
                  >
                    Q{idx + 1} {isAnswered && '•'}
                  </button>
                )
              })}
            </div>

            {/* Active Question Box */}
            {(() => {
              const q = quizData.mcqs[activeQuestionIndex]
              if (!q) return null
              const selectedOpt = userAnswers[activeQuestionIndex]

              return (
                <div className="mcq-body">
                  <div className="mcq-header">
                    <div className="mcq-number-box">
                      <span className="mcq-num">Question {activeQuestionIndex + 1} of {totalQuestionsCount}</span>
                      <span className={`diff-tag diff-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                    </div>
                    <span className="quiz-hint-badge">Select one option</span>
                  </div>

                  <h3 className="mcq-question-text">{q.question}</h3>

                  {/* Options List (Interactive Selection - NO SPOILERS) */}
                  <div className="options-grid">
                    {['A', 'B', 'C', 'D'].map((key) => {
                      const isSelected = selectedOpt === key
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`option-card-interactive ${isSelected ? 'is-selected-opt' : ''}`}
                          onClick={() => handleSelectOption(activeQuestionIndex, key)}
                        >
                          <span className={`option-letter ${isSelected ? 'letter-selected' : ''}`}>{key}</span>
                          <span className="option-text">{q.options[key]}</span>
                          {isSelected && <span className="selected-radio-indicator">✓</span>}
                        </button>
                      )
                    })}
                  </div>

                  {/* Card Navigation Footer */}
                  <div className="mcq-card-footer">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      disabled={activeQuestionIndex === 0}
                      onClick={() => setActiveQuestionIndex((prev) => prev - 1)}
                    >
                      ← Previous
                    </button>
                    
                    <span className="footer-counter">
                      {activeQuestionIndex + 1} / {totalQuestionsCount}
                    </span>

                    {activeQuestionIndex < totalQuestionsCount - 1 ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setActiveQuestionIndex((prev) => prev + 1)}
                      >
                        Next Question →
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={handleSubmitQuiz}
                      >
                        Submit Quiz →
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>

        </div>
      )}

      {/* ====================================================================
          PHASE 2: QUIZ RESULT & REVIEW MODE (After Submission)
          ==================================================================== */}
      {quizData && isSubmitted && scoreStats && (
        <div className="results-container">
          
          {/* FINAL SCORE CARD */}
          <div className="card mcq-score-card">
            <div className="score-card-top">
              <span className="score-badge-official">AI MCQ RESULT</span>
              <h2 className="score-title">Assessment Completed</h2>
              <p className="score-doc-ref">Document: <strong>{quizData.filename}</strong></p>
            </div>

            <div className="score-grid-main">
              <div className="score-circle-box">
                <span className="score-main-number">{scoreStats.correct} / {scoreStats.total}</span>
                <span className="score-pct-number">{scoreStats.percentage}%</span>
                <span className="score-status-text">
                  {scoreStats.percentage >= 80 ? '🌟 Excellent Understanding' : scoreStats.percentage >= 50 ? '👍 Good Effort' : '📚 Review Recommended'}
                </span>
              </div>

              <div className="score-breakdown-box">
                <div className="breakdown-stat stat-correct">
                  <span className="stat-num">{scoreStats.correct}</span>
                  <span className="stat-label">✓ Correct</span>
                </div>
                <div className="breakdown-stat stat-incorrect">
                  <span className="stat-num">{scoreStats.incorrect}</span>
                  <span className="stat-label">✗ Incorrect</span>
                </div>
                {scoreStats.unanswered > 0 && (
                  <div className="breakdown-stat stat-unanswered">
                    <span className="stat-num">{scoreStats.unanswered}</span>
                    <span className="stat-label">— Unanswered</span>
                  </div>
                )}
              </div>
            </div>

            <div className="score-card-actions">
              <button type="button" className="btn btn-primary" onClick={handleRetakeQuiz}>
                🔄 Retake Quiz
              </button>
              <button type="button" className="btn btn-outline" onClick={handleCopyReview}>
                {copied ? '✓ Copied Review' : '📋 Copy Review JSON'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={handleResetAll}>
                Upload Another Document
              </button>
            </div>
          </div>

          {/* Question Review Header & View Switcher */}
          <div className="card results-meta-card">
            <div className="meta-left">
              <h3 className="meta-title">Detailed Question Review &amp; Explanations</h3>
              <p className="meta-sub">Inspect correct answers, explanations, and verified page numbers.</p>
            </div>
            <div className="meta-right">
              <div className="view-toggle">
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'single' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setViewMode('single')}
                >
                  Card View
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'all' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setViewMode('all')}
                >
                  All Questions
                </button>
              </div>
            </div>
          </div>

          {/* Mode 1: Single Card Review with Jump Tabs */}
          {viewMode === 'single' && (
            <div className="card mcq-interactive-card">
              <div className="question-nav-tabs">
                {quizData.mcqs.map((q, idx) => {
                  const userAns = userAnswers[idx]
                  const isCorrect = userAns === q.correctAnswer
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`nav-tab-btn ${activeQuestionIndex === idx ? 'active' : ''} ${isCorrect ? 'tab-correct' : 'tab-incorrect'}`}
                      onClick={() => setActiveQuestionIndex(idx)}
                    >
                      Q{idx + 1} {isCorrect ? '✓' : '✗'}
                    </button>
                  )
                })}
              </div>

              {(() => {
                const q = quizData.mcqs[activeQuestionIndex]
                if (!q) return null
                const userAns = userAnswers[activeQuestionIndex]
                const isCorrect = userAns === q.correctAnswer

                return (
                  <div className="mcq-body">
                    <div className="mcq-header">
                      <div className="mcq-number-box">
                        <span className="mcq-num">Question {activeQuestionIndex + 1} of {totalQuestionsCount}</span>
                        <span className={`diff-tag diff-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                        <span className={`status-pill ${isCorrect ? 'status-correct' : 'status-incorrect'}`}>
                          {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                      <div className="mcq-source-badge">
                        <span>📄 Source: Page {q.sourcePage}</span>
                      </div>
                    </div>

                    <h3 className="mcq-question-text">{q.question}</h3>

                    {/* Answer Comparison Summary */}
                    <div className="answer-comparison-bar">
                      <span className="ans-comp-item">
                        Your Answer: <strong>{userAns ? `${userAns}. ${q.options[userAns]}` : 'Not Answered'}</strong>
                      </span>
                      <span className="ans-comp-item correct-highlight">
                        Correct Answer: <strong>{q.correctAnswer}. {q.options[q.correctAnswer]}</strong>
                      </span>
                    </div>

                    {/* Options Review Grid */}
                    <div className="options-grid">
                      {['A', 'B', 'C', 'D'].map((key) => {
                        const isCorrectOpt = q.correctAnswer === key
                        const isUserChoice = userAns === key

                        let cardClass = 'option-card'
                        if (isCorrectOpt) cardClass += ' is-correct-option'
                        if (isUserChoice && !isCorrectOpt) cardClass += ' is-user-wrong-option'

                        return (
                          <div key={key} className={cardClass}>
                            <span className={`option-letter ${isCorrectOpt ? 'letter-correct' : isUserChoice ? 'letter-wrong' : ''}`}>
                              {key}
                            </span>
                            <span className="option-text">{q.options[key]}</span>
                            {isCorrectOpt && <span className="correct-pill">Correct Answer</span>}
                            {isUserChoice && !isCorrectOpt && <span className="wrong-pill">Your Answer</span>}
                          </div>
                        )
                      })}
                    </div>

                    {/* Explanation Box */}
                    <div className="mcq-explanation-card">
                      <div className="exp-header">
                        <span className="exp-icon">💡</span>
                        <strong>Explanation &amp; Grounding:</strong>
                      </div>
                      <p className="exp-text">{q.explanation}</p>
                    </div>

                    {/* Footer Nav */}
                    <div className="mcq-card-footer">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={activeQuestionIndex === 0}
                        onClick={() => setActiveQuestionIndex((prev) => prev - 1)}
                      >
                        ← Previous
                      </button>
                      <span className="footer-counter">
                        {activeQuestionIndex + 1} / {totalQuestionsCount}
                      </span>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={activeQuestionIndex === totalQuestionsCount - 1}
                        onClick={() => setActiveQuestionIndex((prev) => prev + 1)}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Mode 2: View All Questions in Stacked Review List */}
          {viewMode === 'all' && (
            <div className="all-mcqs-list">
              {quizData.mcqs.map((q, idx) => {
                const userAns = userAnswers[idx]
                const isCorrect = userAns === q.correctAnswer

                return (
                  <div key={idx} className="card mcq-list-card">
                    <div className="mcq-header">
                      <div className="mcq-number-box">
                        <span className="mcq-num">Question {idx + 1}</span>
                        <span className={`diff-tag diff-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                        <span className={`status-pill ${isCorrect ? 'status-correct' : 'status-incorrect'}`}>
                          {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                      <div className="mcq-source-badge">
                        <span>📄 Source: Page {q.sourcePage}</span>
                      </div>
                    </div>

                    <h3 className="mcq-question-text">{q.question}</h3>

                    <div className="answer-comparison-bar">
                      <span className="ans-comp-item">
                        Your Answer: <strong>{userAns ? `${userAns}. ${q.options[userAns]}` : 'Not Answered'}</strong>
                      </span>
                      <span className="ans-comp-item correct-highlight">
                        Correct Answer: <strong>{q.correctAnswer}. {q.options[q.correctAnswer]}</strong>
                      </span>
                    </div>

                    <div className="options-grid">
                      {['A', 'B', 'C', 'D'].map((key) => {
                        const isCorrectOpt = q.correctAnswer === key
                        const isUserChoice = userAns === key

                        let cardClass = 'option-card'
                        if (isCorrectOpt) cardClass += ' is-correct-option'
                        if (isUserChoice && !isCorrectOpt) cardClass += ' is-user-wrong-option'

                        return (
                          <div key={key} className={cardClass}>
                            <span className={`option-letter ${isCorrectOpt ? 'letter-correct' : isUserChoice ? 'letter-wrong' : ''}`}>
                              {key}
                            </span>
                            <span className="option-text">{q.options[key]}</span>
                            {isCorrectOpt && <span className="correct-pill">Correct Answer</span>}
                            {isUserChoice && !isCorrectOpt && <span className="wrong-pill">Your Answer</span>}
                          </div>
                        )
                      })}
                    </div>

                    <div className="mcq-explanation-card">
                      <div className="exp-header">
                        <span className="exp-icon">💡</span>
                        <strong>Explanation:</strong>
                      </div>
                      <p className="exp-text">{q.explanation}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
