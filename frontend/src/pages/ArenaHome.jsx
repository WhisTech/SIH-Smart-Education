import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { 
  Swords, 
  Trophy, 
  Medal, 
  Flame, 
  Target, 
  Play, 
  XCircle, 
  Radio, 
  Bot, 
  Zap, 
  CheckCircle2, 
  ArrowLeft,
  Clock,
  Award,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  UserCheck
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import LoadingScreen from '../components/LoadingScreen'
import AchievementCard from '../components/AchievementCard'
import io from 'socket.io-client'
import './Arena.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

// Configurable human search window (seconds)
const HUMAN_MATCHMAKING_SEARCH_TIMEOUT_SECONDS = 40

export default function ArenaHome() {
  const { user, profile, profileLoading } = useAuth()
  const { t } = useTranslation()
  const socketRef = useRef(null)

  // Arena states: 'LOBBY' | 'SEARCHING' | 'OPPONENT_FOUND' | 'IN_BATTLE'
  const [gameState, setGameState] = useState('LOBBY')
  const [matchMode, setMatchMode] = useState('HUMAN') // 'HUMAN' | 'AI'
  const [loadingStats, setLoadingStats] = useState(true)
  
  // Search & Matchmaking timers
  const [searchTimer, setSearchTimer] = useState(0)
  const [clashCountdown, setClashCountdown] = useState(3)
  const [matchStartCountdown, setMatchStartCountdown] = useState(null) // 3.. 2.. 1.. GO

  // AI Fallback modal controls & Difficulty
  const [showAiFallbackModal, setShowAiFallbackModal] = useState(false)
  const [hasPromptedAiFallback, setHasPromptedAiFallback] = useState(false)
  const [aiDifficulty, setAiDifficulty] = useState('MEDIUM') // 'EASY' | 'MEDIUM' | 'HARD'

  // Real-time Challenge States
  const [incomingChallenge, setIncomingChallenge] = useState(null) // { challengeId, challenger }
  const [sentChallenge, setSentChallenge] = useState(null) // { challengeId, opponent }
  const [statusToast, setStatusToast] = useState(null)

  // Arena Stats
  const [arenaStats, setArenaStats] = useState({
    points: 0,
    rating: 1200,
    wins: 0,
    losses: 0,
    draws: 0,
    streak: 0,
    rank: '-'
  })
  
  const [badges, setBadges] = useState([])

  // Opponent Data
  const [opponent, setOpponent] = useState({
    id: null,
    name: 'Officer',
    department: 'MoSPI',
    rating: 1200,
    points: 0,
    avatar: 'O'
  })

  // Live Battle State
  const [activeMatchId, setActiveMatchId] = useState(null)
  const [currentQuestionData, setCurrentQuestionData] = useState(null)
  const [selectedOption, setSelectedOption] = useState(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [roundTimeLeft, setRoundTimeLeft] = useState(15)
  const [revealedResult, setRevealedResult] = useState(null) // { correctAnswer, player1, player2 }
  const [userScore, setUserScore] = useState(0)
  const [oppScore, setOppScore] = useState(0)
  const [matchResult, setMatchResult] = useState(null) // { result, winnerId, player1Score, player2Score }
  const [opponentDisconnected, setOpponentDisconnected] = useState(false)

  const roundTimerIntervalRef = useRef(null)

  // 1. Fetch real arena profile & badges from backend
  const fetchArenaData = useCallback(async () => {
    if (!user?.id) {
      setLoadingStats(false)
      return
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
      const response = await fetch(`${backendUrl}/api/arena/profile`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      const profileData = response.ok ? await response.json() : null
        
      if (profileData) {
        setArenaStats({
          points: profileData.arena_points || 0,
          rating: profileData.arena_rating || 1200,
          wins: profileData.wins || 0,
          losses: profileData.losses || 0,
          draws: profileData.draws || 0,
          streak: profileData.current_streak || 0,
          totalMatches: profileData.total_matches || 0
        })
        
        if (profileData.badges) {
          setBadges(profileData.badges.map(b => ({
            id: b.id,
            title: b.name,
            description: b.description,
            icon: b.icon,
            earned: true
          })))
        }
      }
    } catch (err) {
      console.error('Error fetching arena data', err)
    } finally {
      setLoadingStats(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchArenaData()
  }, [fetchArenaData])

  // 2. Setup Socket.IO connection & event listeners
  useEffect(() => {
    if (!user) return

    const initSocket = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      socketRef.current = io(BACKEND_URL)
      
      socketRef.current.on('connect', () => {
        socketRef.current.emit('arena:auth', { token: session.access_token })
      })

      socketRef.current.on('arena:auth_success', (data) => {
        console.log("Socket authenticated for Arena", data)
      })

      // When an opponent is found (Challenger side)
      socketRef.current.on('arena:opponent_found', (data) => {
        setShowAiFallbackModal(false)
        setSentChallenge({
          challengeId: data.challengeId,
          opponent: data.opponent
        })
        setOpponent({
          ...data.opponent,
          avatar: (data.opponent.name || 'O').charAt(0).toUpperCase()
        })
      })

      // When an incoming challenge is received (Target side)
      socketRef.current.on('arena:challenge_received', (data) => {
        setShowAiFallbackModal(false)
        setIncomingChallenge({
          challengeId: data.challengeId,
          challenger: data.challenger
        })
        setOpponent({
          ...data.challenger,
          avatar: (data.challenger.name || 'O').charAt(0).toUpperCase()
        })
      })

      // Challenge expired
      socketRef.current.on('arena:challenge_expired', (data) => {
        setIncomingChallenge(null)
        setSentChallenge(null)
        setStatusToast(data.message || 'Challenge expired. Resuming search...')
        setTimeout(() => setStatusToast(null), 4000)
      })

      // Challenge rejected by opponent
      socketRef.current.on('arena:challenge_rejected', (data) => {
        setIncomingChallenge(null)
        setSentChallenge(null)
        setStatusToast(data.message || 'Challenge declined. Resuming search...')
        setTimeout(() => setStatusToast(null), 4000)
      })

      // Challenge cancelled by challenger
      socketRef.current.on('arena:challenge_cancelled', (data) => {
        setIncomingChallenge(null)
        setSentChallenge(null)
        setStatusToast(data.message || 'Challenge cancelled.')
        setTimeout(() => setStatusToast(null), 4000)
      })

      // Match Created (Challenge Accepted or AI Match Initialized) -> Transition to Battle Screen!
      socketRef.current.on('arena:match_created', (data) => {
        setShowAiFallbackModal(false)
        setIncomingChallenge(null)
        setSentChallenge(null)
        setActiveMatchId(data.matchId)
        setGameState('IN_BATTLE')
        setUserScore(0)
        setOppScore(0)
        setMatchResult(null)
        setRevealedResult(null)

        if (data.mode === 'AI' || data.player2?.isAI) {
          setMatchMode('AI')
          setOpponent({
            id: data.player2?.id || 'ai_bot',
            name: data.player2?.name || 'AI Statistical Assistant',
            department: 'MoSPI Automated Competency Trainer',
            rating: 1200,
            points: 500,
            avatar: '🤖'
          })
        }

        // Notify server that player is connected and ready
        socketRef.current?.emit('arena:player_ready', { matchId: data.matchId })
      })

      // Match Starting Countdown: 3.. 2.. 1.. GO
      socketRef.current.on('arena:match_started', (data) => {
        setMatchStartCountdown(data.countdown)
      })

      // Question Started
      socketRef.current.on('arena:question_started', (data) => {
        setMatchStartCountdown(null)
        setRevealedResult(null)
        setSelectedOption(null)
        setHasSubmitted(false)
        setCurrentQuestionData(data)
        setRoundTimeLeft(data.durationSeconds || 15)

        if (roundTimerIntervalRef.current) clearInterval(roundTimerIntervalRef.current)
        roundTimerIntervalRef.current = setInterval(() => {
          setRoundTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(roundTimerIntervalRef.current)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      })

      // Answer Submission Acknowledged
      socketRef.current.on('arena:answer_submitted', (data) => {
        setHasSubmitted(true)
      })

      // Question Round Ended & Answers Revealed
      socketRef.current.on('arena:question_ended', (data) => {
        if (roundTimerIntervalRef.current) clearInterval(roundTimerIntervalRef.current)
        setRoundTimeLeft(0)
        setRevealedResult(data)

        if (data.player1.id === user.id) {
          setUserScore(data.player1.totalScore)
          setOppScore(data.player2.totalScore)
        } else {
          setUserScore(data.player2.totalScore)
          setOppScore(data.player1.totalScore)
        }
      })

      // Match Ended & Final Result
      socketRef.current.on('arena:match_ended', (data) => {
        if (roundTimerIntervalRef.current) clearInterval(roundTimerIntervalRef.current)
        setMatchResult(data)
      })

      socketRef.current.on('arena:result', (data) => {
        setMatchResult(data)
      })

      // Disconnect handling
      socketRef.current.on('arena:player_disconnected', (data) => {
        setOpponentDisconnected(true)
      })

      // Reconnect / Sync State
      socketRef.current.on('arena:sync_state', (data) => {
        setShowAiFallbackModal(false)
        setActiveMatchId(data.matchId)
        setGameState('IN_BATTLE')

        if (data.mode === 'AI' || data.opponent?.isAI) {
          setMatchMode('AI')
          setOpponent(data.opponent || {
            id: 'ai_bot',
            name: 'Arena AI',
            department: 'MoSPI AI Competency Trainer',
            rating: 1200,
            points: 500,
            avatar: '🤖',
            isAI: true
          })
        }

        if (data.scores) {
          setUserScore(data.scores[user?.id] || 0)
          const oppId = data.mode === 'AI' ? 'ai_bot' : Object.keys(data.scores).find(k => k !== user?.id)
          setOppScore(data.scores[oppId] || 0)
        }

        setCurrentQuestionData({
          questionNumber: data.questionNumber,
          totalQuestions: data.totalQuestions,
          question: data.question,
          options: data.options
        })
        setRoundTimeLeft(data.remainingSeconds)
        setHasSubmitted(data.hasSubmittedAnswer)
      })

      socketRef.current.on('arena:error', (data) => {
        console.error('Arena socket error:', data.message)
        setStatusToast(data.message || 'Arena match error occurred.')
        setTimeout(() => setStatusToast(null), 5000)
        setGameState('LOBBY')
        setActiveMatchId(null)
      })
    }

    initSocket()

    return () => {
      if (roundTimerIntervalRef.current) clearInterval(roundTimerIntervalRef.current)
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [user?.id])

  // 3. Search Timer during Matchmaking
  useEffect(() => {
    let interval = null
    if (gameState === 'SEARCHING' && !sentChallenge) {
      interval = setInterval(() => {
        setSearchTimer((prev) => {
          const next = prev + 1
          if (
            matchMode === 'HUMAN' && 
            next >= HUMAN_MATCHMAKING_SEARCH_TIMEOUT_SECONDS && 
            !hasPromptedAiFallback &&
            !sentChallenge &&
            !incomingChallenge
          ) {
            setShowAiFallbackModal(true)
            setHasPromptedAiFallback(true)
          }
          return next
        })
      }, 1000)
    } else if (gameState !== 'SEARCHING') {
      setSearchTimer(0)
      setShowAiFallbackModal(false)
      setHasPromptedAiFallback(false)
    }
    return () => clearInterval(interval)
  }, [gameState, matchMode, hasPromptedAiFallback, sentChallenge, incomingChallenge])

  // Start Searching Flow
  const startMatchmaking = (mode = 'HUMAN', difficulty = aiDifficulty) => {
    setMatchMode(mode)
    setShowAiFallbackModal(false)
    setHasPromptedAiFallback(false)
    setIncomingChallenge(null)
    setSentChallenge(null)
    setSearchTimer(0)
    setGameState('SEARCHING')
    
    if (mode === 'AI') {
      setOpponent({
        id: 'ai_bot',
        name: 'Arena AI',
        department: `MoSPI AI Competency Trainer (${difficulty.charAt(0) + difficulty.slice(1).toLowerCase()})`,
        rating: 1200,
        points: 500,
        avatar: '🤖',
        isAI: true
      })
      // Server-authoritative AI match initialization
      socketRef.current?.emit('arena:start_ai_match', { difficulty })
    } else {
      // HUMAN MATCHMAKING: Request location & broadcast presence
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            socketRef.current?.emit('arena:search', {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            })
          },
          (err) => {
            socketRef.current?.emit('arena:search', {})
          },
          { timeout: 5000 }
        )
      } else {
        socketRef.current?.emit('arena:search', {})
      }
    }
  }

  // Action: Accept Incoming Challenge
  const handleAcceptChallenge = () => {
    if (!incomingChallenge) return
    socketRef.current?.emit('arena:accept_challenge', { challengeId: incomingChallenge.challengeId })
  }

  // Action: Decline Incoming Challenge
  const handleDeclineChallenge = () => {
    if (!incomingChallenge) return
    socketRef.current?.emit('arena:reject_challenge', { challengeId: incomingChallenge.challengeId })
    setIncomingChallenge(null)
  }

  // Action: Cancel Outgoing Challenge Request
  const handleCancelSentChallenge = () => {
    if (!sentChallenge) return
    socketRef.current?.emit('arena:cancel_challenge', { challengeId: sentChallenge.challengeId })
    setSentChallenge(null)
    cancelSearch()
  }

  // Action: Accept AI Fallback
  const handleAcceptAiFallback = (diff = aiDifficulty) => {
    setShowAiFallbackModal(false)
    socketRef.current?.emit('arena:cancel_search')
    startMatchmaking('AI', diff)
  }

  // Action: Keep Searching for human opponent
  const handleKeepSearching = () => {
    setShowAiFallbackModal(false)
    setHasPromptedAiFallback(false)
    setSearchTimer(0)
  }

  // Action: Cancel Matchmaking Search
  const cancelSearch = () => {
    socketRef.current?.emit('arena:cancel_search')
    setGameState('LOBBY')
    setShowAiFallbackModal(false)
    setHasPromptedAiFallback(false)
    setSearchTimer(0)
    setSentChallenge(null)
    setIncomingChallenge(null)
  }

  // Submit Answer to server
  const handleSelectOption = (opt) => {
    if (hasSubmitted || revealedResult || !currentQuestionData) return;

    setSelectedOption(opt)
    setHasSubmitted(true)

    socketRef.current?.emit('arena:submit_answer', {
      matchId: activeMatchId,
      questionNumber: currentQuestionData.questionNumber,
      selectedOption: opt
    })
  }

  // Return to Lobby after match
  const handleReturnToLobby = () => {
    setGameState('LOBBY')
    setActiveMatchId(null)
    setCurrentQuestionData(null)
    setMatchResult(null)
    setRevealedResult(null)
    setOpponentDisconnected(false)
    setShowAiFallbackModal(false)
    setIncomingChallenge(null)
    setSentChallenge(null)
    fetchArenaData()
  }

  if (profileLoading || loadingStats) return <LoadingScreen message="Loading Arena..." />

  const userName = profile?.name || user?.email?.split('@')[0] || 'Official Officer'
  const userInitials = userName.charAt(0).toUpperCase()
  const userDesignation = profile?.designations?.name || profile?.department || 'Statistical Officer'

  // Dynamic search status text
  const getSearchStatusText = () => {
    if (sentChallenge) return `Challenge sent to ${sentChallenge.opponent?.name || 'opponent'}. Waiting for acceptance...`
    if (matchMode === 'AI') return "Initializing AI Trainer Environment..."
    if (searchTimer <= 4) return `Scanning MoSPI network for ${userDesignation} colleagues...`
    if (searchTimer <= 10) return `Checking availability & matching rating (~${arenaStats.rating} ELO)...`
    return `Broadening queue for ${userDesignation} officers...`
  }

  return (
    <div className="dashboard modern-dashboard">
      
      {/* Toast Banner for Matchmaking Events */}
      {statusToast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: '#1e1b4b',
          border: '1px solid #fbbf24',
          color: '#fbbf24',
          padding: '12px 24px',
          borderRadius: '999px',
          fontWeight: '600',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Zap size={16} />
          <span>{statusToast}</span>
        </div>
      )}

      {/* =========================================================================
          INCOMING CHALLENGE DIALOG MODAL (Target Side)
         ========================================================================= */}
      {incomingChallenge && (
        <div className="arena-challenge-overlay">
          <div className="arena-challenge-modal">
            <div className="arena-challenge-icon">
              <Swords size={40} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ffffff', marginBottom: '6px' }}>
              Incoming Battle Challenge!
            </h2>
            <p style={{ color: '#c7d2fe', fontSize: '0.95rem' }}>
              A MoSPI colleague with your shared designation has challenged you to an Arena battle.
            </p>

            <div className="arena-challenge-profile-box">
              <div className="arena-player-avatar" style={{ width: '56px', height: '56px', fontSize: '1.4rem', background: '#2563eb' }}>
                {(incomingChallenge.challenger?.name || 'O').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem' }}>
                  {incomingChallenge.challenger?.name || 'Colleague'}
                </h4>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>
                  {incomingChallenge.challenger?.department || 'National Statistical Office'}
                </div>
                <div style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '4px' }}>
                  {incomingChallenge.challenger?.rating || 1200} ELO · {incomingChallenge.challenger?.points || 0} Pts
                </div>
              </div>
            </div>

            <div className="arena-challenge-actions">
              <button 
                className="btn btn-primary" 
                onClick={handleAcceptChallenge}
                style={{ flex: 1, padding: '14px', fontSize: '1.05rem', background: '#fbbf24', color: '#1e1b4b', fontWeight: 'bold', border: 'none' }}
              >
                <Swords size={18} style={{ marginRight: '8px' }} /> Accept Challenge
              </button>
              <button 
                className="btn btn-outline" 
                onClick={handleDeclineChallenge}
                style={{ flex: 1, padding: '14px', fontSize: '1.05rem', borderColor: '#ef4444', color: '#f87171' }}
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STATE 1: MATCHMAKING SEARCHING VIEW (Full Arena Theme)
         ========================================================================= */}
      {gameState === 'SEARCHING' && (
        <div className="arena-fullscreen-container animate-fade-in">
          <div className="arena-grid-overlay"></div>

          {/* Top HUD */}
          <div className="arena-hud-header" style={{ position: 'absolute', top: 24, width: '100%', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <div className="arena-hud-badge" style={{ background: 'rgba(30, 27, 75, 0.7)', border: '1px solid #4338ca', color: '#c7d2fe', padding: '6px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="arena-hud-live-tag" style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e' }}></span>
              <span>{matchMode === 'HUMAN' ? 'RANKED MATCHMAKING' : 'AI TRAINING MODE'}</span>
            </div>
            <div className="arena-hud-badge" style={{ background: 'rgba(30, 27, 75, 0.7)', border: '1px solid #4338ca', color: '#fbbf24', padding: '6px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={14} />
              <span>Skill Arena v1.0</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', paddingTop: '60px' }}>
            {!sentChallenge ? (
              // SEARCHING STATE: Centered Player with large radar
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h1 style={{ color: '#ffffff', fontSize: '2.5rem', fontWeight: 'bold', textShadow: '0 4px 20px rgba(99, 102, 241, 0.5)', marginBottom: '60px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Swords size={36} color="#fbbf24" />
                  Skill Arena Matchmaking
                </h1>
                
                <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '60px' }}>
                  {/* Radar rings */}
                  <div className="arena-radar-ring" style={{ width: '300px', height: '300px', position: 'absolute', border: '1px solid rgba(99, 102, 241, 0.6)', borderRadius: '50%', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
                  <div className="arena-radar-ring" style={{ width: '450px', height: '450px', position: 'absolute', border: '1px dashed rgba(99, 102, 241, 0.3)', borderRadius: '50%', animation: 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite', animationDelay: '0.5s' }}></div>
                  <div className="arena-radar-ring" style={{ width: '600px', height: '600px', position: 'absolute', border: '1px dotted rgba(99, 102, 241, 0.1)', borderRadius: '50%', animation: 'ping 4s cubic-bezier(0, 0, 0.2, 1) infinite', animationDelay: '1s' }}></div>
                  
                  {/* Player Avatar */}
                  <div style={{ zIndex: 10, background: 'linear-gradient(145deg, #1e1b4b, #312e81)', border: '2px solid #818cf8', padding: '24px', borderRadius: '24px', boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)', textAlign: 'center', width: '260px' }}>
                    <div style={{ margin: '0 auto 12px', width: '80px', height: '80px', borderRadius: '20px', background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', color: '#1e1b4b', boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)' }}>
                      {userInitials}
                    </div>
                    <h3 style={{ color: '#fff', fontSize: '1.4rem', margin: '0 0 4px 0', fontWeight: '700' }}>{userName}</h3>
                    <p style={{ color: '#a5b4fc', fontSize: '0.95rem', margin: '0 0 16px 0' }}>{userDesignation}</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                      <span style={{ background: 'rgba(0,0,0,0.3)', color: '#fbbf24', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Target size={14} /> {arenaStats.rating} ELO</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '1.6rem', color: '#e0e7ff', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <Radio size={24} className="animate-pulse" color="#818cf8" />
                    {matchMode === 'HUMAN' ? 'Searching for Opponent...' : 'Connecting to AI...'}
                  </h2>
                  <p style={{ fontSize: '1.1rem', color: '#818cf8', marginTop: '0' }}>
                    {getSearchStatusText()}
                  </p>
                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#a5b4fc', padding: '6px 20px', borderRadius: '20px', fontSize: '1.2rem', fontFamily: 'monospace', margin: '16px auto 0', display: 'inline-block' }}>
                    00:{searchTimer < 10 ? `0${searchTimer}` : searchTimer}
                  </div>
                </div>
              </div>
            ) : (
              // OPPONENT FOUND STATE: Red vs Blue collision
              <div className="arena-search-stage" style={{ width: '100%', marginTop: '40px' }}>
                <div className="arena-matchmaking-duo">
                  {/* Player 1 (You) Card - Left */}
                  <div className="arena-player-card red-side">
                    <div className="arena-player-avatar-wrapper">
                      <div className="arena-player-avatar">{userInitials}</div>
                      <div className="arena-avatar-pulse-ring"></div>
                    </div>
                    <h3 className="arena-player-name">{userName}</h3>
                    <p className="arena-player-desig">{userDesignation}</p>
                    <div className="arena-player-stats-row">
                      <span className="arena-stat-pill"><Target size={14} /> {arenaStats.rating} ELO</span>
                      <span className="arena-stat-pill"><Zap size={14} /> {arenaStats.points} Pts</span>
                    </div>
                  </div>

                  {/* Center Radar Scanner */}
                  <div className="arena-radar-center">
                    <Swords size={56} color="#fbbf24" className="animate-pulse" style={{ filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))' }} />
                  </div>

                  {/* Player 2 (Matched Opponent) Card - Right */}
                  <div className="arena-player-card blue-side">
                    <div className="arena-player-avatar-wrapper">
                      <div className="arena-player-avatar" style={{ background: '#2563eb' }}>
                        {(sentChallenge.opponent?.name || 'O').charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <h3 className="arena-player-name">{sentChallenge.opponent?.name}</h3>
                    <p className="arena-player-desig">{sentChallenge.opponent?.department || userDesignation}</p>
                    <div className="arena-player-stats-row">
                      <span className="arena-stat-pill" style={{ color: '#fbbf24' }}>
                        {sentChallenge.opponent?.rating || 1200} ELO
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="arena-searching-text-box" style={{ marginTop: '60px' }}>
                  <h2 className="arena-searching-title" style={{ fontSize: '2rem', color: '#fbbf24', textShadow: '0 0 10px rgba(251, 191, 36, 0.3)' }}>
                    Opponent Found!
                  </h2>
                  <p className="arena-searching-subtitle">Waiting for {sentChallenge.opponent?.name} to accept challenge...</p>
                </div>
              </div>
            )}

            {/* Cancel Action */}
            <button 
              className="btn btn-outline" 
              style={{ marginTop: '48px', borderColor: 'rgba(239, 68, 68, 0.5)', color: '#fca5a5', padding: '12px 32px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)', transition: 'all 0.2s', zIndex: 20 }} 
              onClick={sentChallenge ? handleCancelSentChallenge : cancelSearch}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'; e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.background = 'rgba(0,0,0,0.2)' }}
            >
              <XCircle size={18} style={{ marginRight: '8px' }} /> {sentChallenge ? 'Cancel Challenge' : 'Cancel Search'}
            </button>
          </div>

          {/* =========================================================================
              AI FALLBACK CONFIRMATION POPUP
             ========================================================================= */}
          {showAiFallbackModal && (
            <div className="arena-ai-fallback-overlay" style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)' }}>
              <div className="arena-ai-fallback-modal" style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 100%)', border: '1px solid #6366f1', borderRadius: '24px', padding: '48px', maxWidth: '540px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.2)' }}>
                <div className="arena-ai-modal-icon" style={{ background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 100%)', color: '#fbbf24', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 20px rgba(79, 70, 229, 0.5)' }}>
                  <Bot size={40} />
                </div>
                <h3 className="arena-ai-modal-title" style={{ color: '#ffffff', fontSize: '1.8rem', fontWeight: '800', marginBottom: '16px', letterSpacing: '-0.02em' }}>Still no opponent found</h3>
                <p className="arena-ai-modal-desc" style={{ color: '#c7d2fe', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '24px' }}>
                  We couldn't match you with a nearby <strong>{userDesignation}</strong> in the queue. You can battle against Arena AI or continue searching.
                </p>

                {/* Difficulty Selector */}
                <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#c7d2fe', fontSize: '0.9rem', marginRight: '4px' }}>AI Difficulty:</span>
                  {['EASY', 'MEDIUM', 'HARD'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setAiDifficulty(diff)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        border: aiDifficulty === diff ? '2px solid #fbbf24' : '1px solid #4338ca',
                        background: aiDifficulty === diff ? 'rgba(251, 191, 36, 0.25)' : 'rgba(30, 27, 75, 0.6)',
                        color: aiDifficulty === diff ? '#fbbf24' : '#c7d2fe',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {diff.charAt(0) + diff.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>

                <div className="arena-ai-modal-actions" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleAcceptAiFallback(aiDifficulty)}
                    style={{ padding: '16px', background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)', color: '#1e1b4b', fontWeight: 'bold', border: 'none', fontSize: '1.1rem', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)' }}
                  >
                    <Bot size={22} style={{ marginRight: '12px' }} /> Battle with AI ({aiDifficulty.charAt(0) + aiDifficulty.slice(1).toLowerCase()})
                  </button>
                  <button 
                    className="btn btn-outline" 
                    onClick={handleKeepSearching}
                    style={{ padding: '16px', borderColor: '#6366f1', color: '#e0e7ff', fontWeight: '600', fontSize: '1.1rem', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(99, 102, 241, 0.1)' }}
                  >
                    <Radio size={20} style={{ marginRight: '12px' }} /> Continue Searching
                  </button>
                  <button 
                    type="button"
                    onClick={cancelSearch}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', marginTop: '8px', cursor: 'pointer', fontSize: '0.95rem', textDecoration: 'underline', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.target.style.color = '#f87171'}
                    onMouseLeave={(e) => e.target.style.color = '#ef4444'}
                  >
                    Cancel Search
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          STATE 2: LIVE BATTLE ARENA SCREEN
         ========================================================================= */}
      {gameState === 'IN_BATTLE' && (
        <div className="arena-fullscreen-container animate-fade-in">
          <div className="arena-grid-overlay"></div>

          {/* Synchronized 3.. 2.. 1.. Match Start Countdown */}
          {matchStartCountdown !== null && (
            <div className="arena-countdown-overlay">
              <div className="arena-countdown-number">
                {matchStartCountdown > 0 ? matchStartCountdown : 'GO!'}
              </div>
              <p style={{ color: '#c7d2fe', marginTop: '16px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                Preparing Question 1...
              </p>
            </div>
          )}

          {/* Opponent Disconnect Banner */}
          {opponentDisconnected && (
            <div className="arena-disconnect-banner">
              <AlertTriangle size={18} />
              <span>Opponent temporarily disconnected. Waiting for reconnection window (15s)...</span>
            </div>
          )}

          <div className="arena-battle-screen">
            
            {/* Top HUD Player Scoreboard */}
            <div className="arena-battle-hud">
              <div className="arena-hud-player">
                <div className="arena-hud-avatar" style={{ background: '#dc2626' }}>{userInitials}</div>
                <div>
                  <div className="arena-hud-player-name">{userName} (You)</div>
                  <div className="arena-hud-score">{userScore} Pts</div>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <span className="arena-vs-small">VS</span>
                {matchMode === 'AI' && (
                  <div style={{
                    background: 'rgba(99, 102, 241, 0.25)',
                    border: '1px solid #818cf8',
                    color: '#c7d2fe',
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    margin: '2px auto 0',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px',
                    display: 'inline-block'
                  }}>
                    🤖 AI BATTLE
                  </div>
                )}
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '2px', fontWeight: '600' }}>
                  Question {currentQuestionData?.questionNumber || 1} of {currentQuestionData?.totalQuestions || 5}
                </div>
              </div>

              <div className="arena-hud-player" style={{ flexDirection: 'row-reverse' }}>
                <div className="arena-hud-avatar" style={{ background: matchMode === 'AI' ? '#4f46e5' : '#2563eb' }}>{opponent.avatar || '🤖'}</div>
                <div style={{ textAlign: 'right' }}>
                  <div className="arena-hud-player-name" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                    {opponent.name}
                    {matchMode === 'AI' && (
                      <span style={{ background: '#312e81', color: '#fbbf24', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', border: '1px solid #4338ca', fontWeight: 'bold' }}>
                        AI
                      </span>
                    )}
                  </div>
                  <div className="arena-hud-score">{oppScore} Pts</div>
                </div>
              </div>
            </div>

            {/* 5-Question Round Progress Dots */}
            <div className="arena-round-dots-row">
              {[1, 2, 3, 4, 5].map((qNum) => {
                const isCurrent = (currentQuestionData?.questionNumber === qNum);
                const isPast = ((currentQuestionData?.questionNumber || 1) > qNum);
                return (
                  <div 
                    key={qNum} 
                    className={`arena-round-dot ${isCurrent ? 'active' : ''} ${isPast ? 'completed' : ''}`}
                  >
                    {isPast ? '✓' : `Q${qNum}`}
                  </div>
                );
              })}
            </div>

            {/* Round 15s Timer Bar */}
            <div className="arena-timer-bar-container">
              <div 
                className="arena-timer-bar-fill" 
                style={{ width: `${(roundTimeLeft / 15) * 100}%` }}
              ></div>
            </div>

            {/* Main Question Card */}
            {currentQuestionData ? (
              <div className="arena-question-card">
                <div className="arena-question-header">
                  <span style={{ color: '#818cf8', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Target size={16} /> STATISTICAL DOMAIN COMPETENCY
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} color={roundTimeLeft <= 4 ? '#ef4444' : '#fbbf24'} />
                    <span style={{ color: roundTimeLeft <= 4 ? '#ef4444' : '#fbbf24', fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {roundTimeLeft}s
                    </span>
                  </div>
                </div>

                <h2 className="arena-question-title">
                  {currentQuestionData.question}
                </h2>

                <div className="arena-options-grid">
                  {currentQuestionData.options.map((opt, idx) => {
                    let btnClass = 'arena-option-btn'
                    if (selectedOption === opt) btnClass += ' selected'
                    
                    // Reveal styling
                    if (revealedResult) {
                      btnClass += ' disabled'
                      if (opt === revealedResult.correctAnswer) {
                        btnClass += ' correct-reveal'
                      } else if (selectedOption === opt) {
                        btnClass += ' wrong-reveal'
                      }
                    } else if (hasSubmitted) {
                      btnClass += ' disabled'
                    }

                    return (
                      <button
                        key={idx}
                        className={btnClass}
                        onClick={() => handleSelectOption(opt)}
                        disabled={hasSubmitted || Boolean(revealedResult)}
                      >
                        <span className="arena-option-prefix">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Status Bar inside question card */}
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {hasSubmitted && !revealedResult && (
                    <div className="arena-status-pill">
                      <CheckCircle2 size={16} color="#10b981" />
                      <span>Answer locked! Waiting for opponent / timer...</span>
                    </div>
                  )}

                  {revealedResult && (
                    <div className="arena-status-pill" style={{ background: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981', color: '#6ee7b7' }}>
                      <Zap size={16} color="#fbbf24" />
                      <span>
                        {selectedOption === revealedResult.correctAnswer
                          ? `Correct! +${revealedResult.player1.id === user.id ? revealedResult.player1.pointsEarned : revealedResult.player2.pointsEarned} Pts`
                          : 'Incorrect (0 Pts)'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="arena-question-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
                <p style={{ color: '#c7d2fe', fontWeight: 'bold' }}>Loading arena question...</p>
              </div>
            )}

            {/* Footer Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <button className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#c7d2fe' }} onClick={handleReturnToLobby}>
                <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Forfeit / Return to Lobby
              </button>
            </div>

          </div>

          {/* =========================================================================
              FINAL MATCH RESULTS MODAL
             ========================================================================= */}
          {matchResult && (
            <div className="arena-match-result-overlay">
              <div className="arena-result-modal">
                {/* Match Mode Tag */}
                <div style={{ marginBottom: '12px' }}>
                  <span style={{
                    background: matchResult.mode === 'AI' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                    border: matchResult.mode === 'AI' ? '1px solid #6366f1' : '1px solid #fbbf24',
                    color: matchResult.mode === 'AI' ? '#c7d2fe' : '#fbbf24',
                    padding: '4px 14px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px'
                  }}>
                    {matchResult.mode === 'AI' ? '🤖 AI BATTLE MODE' : '⚔️ RANKED MATCH (PVP)'}
                  </span>
                </div>

                <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>
                  {matchResult.result === 'DRAW' ? '🤝' : (matchResult.winnerId === user.id ? '🏆' : '⚔️')}
                </div>

                <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: matchResult.winnerId === user.id ? '#fbbf24' : '#ffffff', marginBottom: '8px' }}>
                  {matchResult.result === 'DRAW'
                    ? 'MATCH DRAW'
                    : (matchResult.winnerId === user.id ? 'VICTORY!' : 'DEFEAT')}
                </h2>

                <p style={{ color: '#c7d2fe', fontSize: '1rem', marginBottom: '12px' }}>
                  {matchResult.result === 'DRAW'
                    ? 'Both sides demonstrated equal statistical proficiency.'
                    : (matchResult.winnerId === user.id
                        ? (matchResult.mode === 'AI' ? 'Outstanding victory! You defeated Arena AI.' : 'Outstanding performance! You won the battle.')
                        : (matchResult.mode === 'AI' ? 'Arena AI took this battle. Review domain competencies to bounce back!' : 'Good effort! Review domain competencies to bounce back.'))}
                </p>

                {/* Arena Points Rewards Pill */}
                {matchResult.player1Stats && (
                  <div style={{
                    margin: '0 auto 16px',
                    padding: '8px 18px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: matchResult.player1Stats.pointsChange > 0 ? 'rgba(34, 197, 94, 0.15)' : (matchResult.player1Stats.pointsChange < 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(148, 163, 184, 0.15)'),
                    border: matchResult.player1Stats.pointsChange > 0 ? '1px solid #22c55e' : (matchResult.player1Stats.pointsChange < 0 ? '1px solid #ef4444' : '1px solid #94a3b8'),
                    color: matchResult.player1Stats.pointsChange > 0 ? '#4ade80' : (matchResult.player1Stats.pointsChange < 0 ? '#f87171' : '#cbd5e1'),
                    fontWeight: 'bold',
                    fontSize: '1.05rem'
                  }}>
                    <Zap size={16} />
                    <span>Arena Points:</span>
                    <span>
                      {matchResult.player1Stats.pointsChange > 0 ? `+${matchResult.player1Stats.pointsChange}` : matchResult.player1Stats.pointsChange} Pts
                    </span>
                  </div>
                )}

                {/* Score Comparison Box */}
                <div className="arena-result-scores-box">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>{userName} (You)</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fbbf24' }}>
                      {matchResult.player1Score} Pts
                    </div>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#64748b' }}>VS</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>{matchResult.mode === 'AI' ? 'Arena AI' : opponent.name}</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#818cf8' }}>
                      {matchResult.player2Score} Pts
                    </div>
                  </div>
                </div>

                {/* Question Performance Breakdown */}
                {matchResult.breakdown && matchResult.breakdown.length > 0 && (
                  <div className="arena-breakdown-container">
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '8px' }}>
                      Round-by-Round Breakdown
                    </div>
                    {matchResult.breakdown.map((item, idx) => {
                      const isP1You = item.player1.id === user.id || matchResult.mode === 'AI';
                      const youAns = isP1You ? item.player1 : item.player2;
                      const oppAns = isP1You ? item.player2 : item.player1;
                      const oppLabel = matchResult.mode === 'AI' ? 'Arena AI' : 'Opponent';
                      return (
                        <div key={idx} className="arena-breakdown-item">
                          <div className="arena-breakdown-header">
                            <span style={{ fontWeight: '600', color: '#ffffff' }}>Q{item.questionNumber}: {item.question.slice(0, 55)}...</span>
                          </div>
                          <div className="arena-breakdown-scores">
                            <span style={{ color: youAns.isCorrect ? '#10b981' : '#ef4444' }}>
                              You: {youAns.isCorrect ? `Correct (+${youAns.points} Pts)` : 'Incorrect (0 Pts)'}
                            </span>
                            <span style={{ color: oppAns.isCorrect ? '#10b981' : '#ef4444' }}>
                              {oppLabel}: {oppAns.isCorrect ? `Correct (+${oppAns.points} Pts)` : 'Incorrect (0 Pts)'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button 
                  className="btn btn-primary" 
                  onClick={handleReturnToLobby}
                  style={{ width: '100%', padding: '14px', fontSize: '1.1rem', background: '#fbbf24', color: '#1e1b4b', fontWeight: 'bold', border: 'none', marginTop: '12px' }}
                >
                  <RotateCcw size={18} style={{ marginRight: '8px' }} /> Return to Arena Lobby
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          STATE 3: MAIN ARENA LOBBY (Default View)
         ========================================================================= */}
      {gameState === 'LOBBY' && (
        <>
          {/* 1. HERO BANNER */}
          <div className="dashboard-hero-banner animate-slide-in" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: 'white' }}>
            <div className="hero-profile-row" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="hero-info">
                <h1 className="hero-name" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Swords size={28} color="#fbbf24" /> Skill Arena
                </h1>
                <p className="hero-meta" style={{ color: '#c7d2fe', marginTop: '8px', fontSize: '1.1rem' }}>
                  Compete in real-time battles to test your statistical knowledge.
                </p>
              </div>
              <div className="hero-gamification-widget">
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', padding: '16px 24px', borderRadius: '12px', backdropFilter: 'blur(4px)' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24' }}>
                    {arenaStats.points} Points
                  </div>
                  <div style={{ color: '#e0e7ff', marginTop: '4px', fontWeight: '500' }}>Global Rank: {arenaStats.rank}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. QUICK STATS */}
          <div className="stat-grid modern-stat-grid">
            <div className="stat-card modern-stat-card">
              <div className="stat-icon-box" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Target size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Arena Rating</span>
                <span className="stat-value">{arenaStats.rating}</span>
              </div>
            </div>
            <div className="stat-card modern-stat-card">
              <div className="stat-icon-box" style={{ background: '#dcfce7', color: '#15803d' }}>
                <Trophy size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Wins / Losses / Draws</span>
                <span className="stat-value">{arenaStats.wins} / {arenaStats.losses} / {arenaStats.draws}</span>
              </div>
            </div>
            <div className="stat-card modern-stat-card">
              <div className="stat-icon-box" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                <Flame size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Win Streak</span>
                <span className="stat-value" style={{ color: '#ef4444' }}>{arenaStats.streak} 🔥</span>
              </div>
            </div>
          </div>

          {/* 3. MATCHMAKING MODES SECTION */}
          <div className="card animate-card" style={{ marginTop: '24px', padding: '36px 28px' }}>
            <div className="card-header-clean" style={{ marginBottom: '24px' }}>
              <div className="header-title-group">
                <span className="section-pill" style={{ background: '#e0e7ff', color: '#4338ca' }}>Battle Modes</span>
                <h3 className="section-heading">Select Game Mode</h3>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              
              {/* Ranked Human vs Human */}
              <div style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                borderRadius: '16px',
                padding: '28px',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                border: '1px solid rgba(129, 140, 248, 0.3)',
                boxShadow: '0 10px 25px rgba(30, 27, 75, 0.2)'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ background: '#fbbf24', padding: '8px', borderRadius: '10px', color: '#1e1b4b' }}>
                      <Swords size={22} />
                    </div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Ranked Arena (PVP)</h4>
                  </div>
                  <p style={{ color: '#c7d2fe', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '24px' }}>
                    Challenge active MoSPI officers with your shared designation in real-time. Gain Arena Points, increase your rating, and top the global leaderboard.
                  </p>
                </div>
                <button className="btn btn-primary" onClick={() => startMatchmaking('HUMAN')} style={{ width: '100%', padding: '12px', fontSize: '1rem', background: '#fbbf24', color: '#1e1b4b', border: 'none', fontWeight: 'bold' }}>
                  <Play size={18} style={{ marginRight: '8px' }} /> Find Ranked Opponent
                </button>
              </div>

              {/* AI Practice Mode */}
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '28px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ background: '#e0e7ff', padding: '8px', borderRadius: '10px', color: '#4f46e5' }}>
                      <Bot size={22} />
                    </div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>AI Practice Match</h4>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '16px' }}>
                    Train your domain competencies against the MoSPI AI assistant without risking your competitive ELO rating.
                  </p>

                  {/* AI Difficulty Selector */}
                  <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>Difficulty:</span>
                    {['EASY', 'MEDIUM', 'HARD'].map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setAiDifficulty(diff)}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '16px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          border: aiDifficulty === diff ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                          background: aiDifficulty === diff ? '#e0e7ff' : '#f8fafc',
                          color: aiDifficulty === diff ? '#4338ca' : '#64748b',
                          transition: 'all 0.2s'
                        }}
                      >
                        {diff.charAt(0) + diff.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="btn btn-outline" onClick={() => startMatchmaking('AI', aiDifficulty)} style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 'bold' }}>
                  <Bot size={18} style={{ marginRight: '8px' }} /> Train Against AI
                </button>
              </div>

            </div>
          </div>

          {/* 4. BADGES SECTION - only render if badges exist */}
          {badges.length > 0 && (
            <div className="card achievements-dashboard-card animate-card" style={{ marginTop: '24px' }}>
              <div className="card-header-clean">
                <div className="header-title-group">
                  <span className="section-pill" style={{ background: '#fef3c7', color: '#b45309' }}>Arena Badges</span>
                  <h3 className="section-heading">Combat Achievements</h3>
                </div>
              </div>
              <div className="achievements-grid">
                {badges.map((badge) => (
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
          )}
        </>
      )}

    </div>
  )
}
