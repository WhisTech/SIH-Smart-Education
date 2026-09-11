import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

// 4-second cooldown window to prevent simultaneous multi-event triggers (e.g., Alt+Tab firing blur + visibilitychange + fullscreenchange)
const VIOLATION_COOLDOWN_MS = 4000

// Standardized Proctoring Violation Event Types
export const PROCTORING_EVENTS = {
  CAMERA_DENIED: 'CAMERA_DENIED',
  CAMERA_DISCONNECTED: 'CAMERA_DISCONNECTED',
  CAMERA_INTERRUPTED: 'CAMERA_INTERRUPTED',
  TAB_SWITCH: 'TAB_SWITCH',
  WINDOW_BLUR: 'WINDOW_BLUR',
  FULLSCREEN_EXIT: 'FULLSCREEN_EXIT'
}

// Reusable Proctoring Modes Configuration System
export const PROCTORING_MODES = {
  BASIC: {
    name: 'BASIC',
    label: 'Basic Secure Mode',
    requireCamera: true,
    requireFullscreen: true,
    detectTabSwitch: true,
    detectWindowBlur: true,
    detectCameraInterruption: true,
    detectFace: false,
    detectMultipleFaces: false
  },
  AI_FACE: {
    name: 'AI_FACE',
    label: 'AI Face Proctored Mode',
    requireCamera: true,
    requireFullscreen: true,
    detectTabSwitch: true,
    detectWindowBlur: true,
    detectCameraInterruption: true,
    detectFace: true,
    detectMultipleFaces: true
  },
  STRICT: {
    name: 'STRICT',
    label: 'Strict AI Security Mode (Recommended)',
    requireCamera: true,
    requireFullscreen: true,
    detectTabSwitch: true,
    detectWindowBlur: true,
    detectCameraInterruption: true,
    detectFace: true,
    detectMultipleFaces: true
  }
}

/**
 * useProctoring
 * Centralized, multi-layer browser-native proctoring engine with local face-api.js integration.
 * 
 * @param {string|null} assessmentId - Current assessment ID
 * @param {boolean} isActive - Whether the exam is actively running
 * @param {string} proctoringMode - 'STRICT' | 'AI_FACE' | 'BASIC' (defaults to 'STRICT')
 * @param {Function} onTerminated - Callback when the exam is cancelled/terminated
 */
export function useProctoring({ assessmentId, isActive = false, proctoringMode = 'STRICT', onTerminated }) {
  const mode = PROCTORING_MODES[proctoringMode] || PROCTORING_MODES.STRICT

  // Camera state
  const [stream, setStream] = useState(null)
  const [cameraStatus, setCameraStatus] = useState('idle') // 'idle' | 'requesting' | 'granted' | 'denied' | 'error' | 'disconnected'
  const [cameraError, setCameraError] = useState('')

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenError, setFullscreenError] = useState('')

  // Face API ML State
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [modelError, setModelError] = useState('')
  const [faceStatus, setFaceStatus] = useState(mode.detectFace ? 'initializing' : 'disabled')
  const [faceCount, setFaceCount] = useState(0)

  // Warning & Termination state
  const [warningCount, setWarningCount] = useState(0)
  const [isTerminated, setIsTerminated] = useState(false)
  const [currentViolation, setCurrentViolation] = useState(null)
  const [isViolationModalOpen, setIsViolationModalOpen] = useState(false)

  // Refs for tracking state safely inside async event listeners
  const streamRef = useRef(null)
  const lastViolationTimeRef = useRef(0)
  const isTerminatedRef = useRef(false)
  const isActiveRef = useRef(isActive)
  const isPausedRef = useRef(false) // Guard for normal submission or clean exits

  // Keep refs updated
  useEffect(() => {
    isActiveRef.current = isActive
  }, [isActive])

  useEffect(() => {
    isTerminatedRef.current = isTerminated
  }, [isTerminated])

  /**
   * Pause monitoring temporarily during normal actions (e.g. final submission)
   */
  const pauseProctoring = useCallback(() => {
    isPausedRef.current = true
  }, [])

  /**
   * Resume monitoring
   */
  const resumeProctoring = useCallback(() => {
    isPausedRef.current = false
  }, [])

  const isModelLoadingRef = useRef(false)
  const isModelLoadedRef = useRef(false)

  /**
   * 1. Lazy load local Face Detection model weights from /models directory
   */
  useEffect(() => {
    if (!mode.detectFace || isModelLoadedRef.current || isModelLoadingRef.current) return
    let isMounted = true

    const loadLocalFaceModel = async () => {
      try {
        isModelLoadingRef.current = true
        setIsModelLoading(true)
        setModelError('')
        console.log('[Proctoring] Loading local face detector from /models...')
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
        
        isModelLoadedRef.current = true
        if (isMounted) {
          setIsModelLoaded(true)
          setIsModelLoading(false)
          setFaceStatus('one_face')
          console.log('[Proctoring] Local AI face model loaded and ready.')
        }
      } catch (err) {
        console.error('[Proctoring] Failed to load local face model:', err)
        if (isMounted) {
          setModelError('Failed to load local AI face detection model files.')
          setIsModelLoading(false)
        }
      } finally {
        isModelLoadingRef.current = false
      }
    }

    loadLocalFaceModel()

    return () => {
      isMounted = false
    }
  }, [mode.detectFace])

  /**
   * 2. Request webcam access using free browser MediaDevices API
   */
  const requestCameraPermission = useCallback(async () => {
    try {
      setCameraStatus('requesting')
      setCameraError('')

      // HTTPS / Secure Context Verification
      const isSecure = typeof window !== 'undefined' && (
        window.isSecureContext || 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1'
      )

      if (!isSecure) {
        throw new Error('Webcam proctoring requires a secure HTTPS connection or localhost environment. Please access this platform over HTTPS.')
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser. Please use a modern browser like Chrome, Edge, or Firefox.')
      }

      // Request user-facing video only (STRICTLY NO AUDIO/MICROPHONE)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      })

      streamRef.current = mediaStream
      setStream(mediaStream)
      setCameraStatus('granted')
      return true
    } catch (err) {
      console.error('Camera permission failed:', err)
      setCameraStatus('denied')
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. You must grant webcam access to take this assessment.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No webcam was detected on your device. A working camera is required.')
      } else {
        setCameraError(err.message || 'Unable to access camera.')
      }
      return false
    }
  }, [])

  /**
   * 3. Stop camera stream and release hardware cleanly
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch (e) {
          console.warn('Error stopping track:', e)
        }
      })
      streamRef.current = null
      setStream(null)
    }
  }, [])

  /**
   * 4. Request Fullscreen mode via native browser API (must be user gesture initiated)
   */
  const enterFullscreen = useCallback(async () => {
    try {
      setFullscreenError('')
      const docEl = document.documentElement
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen()
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen()
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen()
      }
      setIsFullscreen(true)
      return true
    } catch (err) {
      console.warn('Fullscreen request failed:', err)
      setFullscreenError('Fullscreen mode is required to take this assessment. Please allow fullscreen in your browser and try again.')
      setIsFullscreen(false)
      return false
    }
  }, [])

  /**
   * 5. Exit Fullscreen cleanly
   */
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen()
        }
      }
      setIsFullscreen(false)
    } catch (e) {
      console.warn('Error exiting fullscreen:', e)
    }
  }, [])

  /**
   * 6. Centralized Violation Reporter to Supabase via backend API
   */
  const triggerViolation = useCallback(async (violationType, metadata = {}) => {
    // Ignore if proctoring is paused (e.g. during normal submit), inactive, already terminated, or no assessment ID
    if (isPausedRef.current || !isActiveRef.current || isTerminatedRef.current || !assessmentId) {
      return
    }

    // Standardize event type
    const stdType = PROCTORING_EVENTS[violationType] || violationType

    // Debounce / Cooldown check:
    // Prevents multi-event triggers from counting as multiple violations for a single action
    const now = Date.now()
    if (now - lastViolationTimeRef.current < VIOLATION_COOLDOWN_MS) {
      console.log(`[Proctoring] Suppressed multi-event violation within cooldown (${stdType})`)
      return
    }
    lastViolationTimeRef.current = now

    console.warn(`[Proctoring] Registering violation: ${stdType}`)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      const res = await fetch(`${BACKEND_URL}/api/assessment/${assessmentId}/violation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          violationType: stdType,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString()
          }
        })
      })

      const data = await res.json()
      if (!data.success) {
        console.error('[Proctoring] Failed to log violation:', data.message)
        return
      }

      const warningNum = data.warningNumber || 1
      const terminated = data.terminated || warningNum >= 3

      setWarningCount(warningNum)
      setCurrentViolation({
        type: stdType,
        warningNumber: warningNum,
        message: data.message || `Warning ${warningNum} of 3 recorded.`
      })
      setIsViolationModalOpen(true)

      if (terminated) {
        setIsTerminated(true)
        isTerminatedRef.current = true
        stopCamera()
        if (onTerminated) {
          onTerminated(stdType)
        }
      }
    } catch (err) {
      console.error('[Proctoring] Network error logging violation:', err)
    }
  }, [assessmentId, onTerminated, stopCamera])

  /**
   * 7. Dismiss warning modal (allowed only for warnings 1 and 2)
   */
  const dismissWarning = useCallback(() => {
    if (!isTerminatedRef.current && warningCount < 3) {
      setIsViolationModalOpen(false)
      // Attempt to re-enter fullscreen if user exited
      if (!document.fullscreenElement) {
        enterFullscreen()
      }
    }
  }, [warningCount, enterFullscreen])

  /**
   * 8. Fullscreen Change Listener (Layer A)
   */
  useEffect(() => {
    if (!mode.requireFullscreen) return

    const handleFullscreenChange = () => {
      const inFull = !!(document.fullscreenElement || document.webkitFullscreenElement)
      setIsFullscreen(inFull)

      if (!inFull && isActiveRef.current && !isTerminatedRef.current && !isPausedRef.current) {
        triggerViolation(PROCTORING_EVENTS.FULLSCREEN_EXIT, { detail: 'User exited fullscreen mode' })
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [mode.requireFullscreen, triggerViolation])

  /**
   * 9. Tab Switch & Page Visibility Listener (Layer A)
   */
  useEffect(() => {
    if (!mode.detectTabSwitch) return

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        if (isActiveRef.current && !isTerminatedRef.current && !isPausedRef.current) {
          triggerViolation(PROCTORING_EVENTS.TAB_SWITCH, { detail: 'Page hidden / Tab switched' })
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [mode.detectTabSwitch, triggerViolation])

  /**
   * 10. Window Focus Loss Listener (Layer A)
   */
  useEffect(() => {
    if (!mode.detectWindowBlur) return

    const handleWindowBlur = () => {
      if (isActiveRef.current && !isTerminatedRef.current && !isPausedRef.current) {
        triggerViolation(PROCTORING_EVENTS.WINDOW_BLUR, { detail: 'Browser window lost focus' })
      }
    }

    window.addEventListener('blur', handleWindowBlur)
    return () => {
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [mode.detectWindowBlur, triggerViolation])

  /**
   * 11. Camera Stream Disconnect & Status Monitoring (Layer A)
   */
  useEffect(() => {
    if (!stream || !isActive || isPausedRef.current || !mode.detectCameraInterruption) return

    const videoTrack = stream.getVideoTracks()[0]
    if (!videoTrack) return

    const handleTrackEnded = () => {
      console.warn('[Proctoring] Camera track ended unexpectedly')
      setCameraStatus('disconnected')
      triggerViolation(PROCTORING_EVENTS.CAMERA_DISCONNECTED, { detail: 'Camera hardware disconnected' })
    }

    const handleTrackMute = () => {
      console.warn('[Proctoring] Camera track muted')
      setCameraStatus('disconnected')
      triggerViolation(PROCTORING_EVENTS.CAMERA_INTERRUPTED, { detail: 'Camera track muted' })
    }

    videoTrack.addEventListener('ended', handleTrackEnded)
    videoTrack.addEventListener('mute', handleTrackMute)

    const interval = setInterval(() => {
      if (isPausedRef.current) return
      if (!videoTrack || videoTrack.readyState === 'ended' || !videoTrack.enabled) {
        setCameraStatus('disconnected')
        triggerViolation(PROCTORING_EVENTS.CAMERA_DISCONNECTED, { detail: 'Camera stream inactive' })
      }
    }, 3000)

    return () => {
      videoTrack.removeEventListener('ended', handleTrackEnded)
      videoTrack.removeEventListener('mute', handleTrackMute)
      clearInterval(interval)
    }
  }, [stream, isActive, mode.detectCameraInterruption, triggerViolation])

  /**
   * 12. Layer B — Local AI Face Detection Loop (0 CDN calls, uses EXISTING MediaStream)
   */
  useEffect(() => {
    if (!stream || !mode.detectFace || !isModelLoaded) return

    // Create offscreen video element attached to the EXISTING MediaStream (0 duplicate getUserMedia calls)
    const videoEl = document.createElement('video')
    videoEl.srcObject = stream
    videoEl.muted = true
    videoEl.playsInline = true
    videoEl.play().catch(() => {})

    let isDetecting = false
    let noFaceStart = null
    let multipleFaceStart = null

    const detectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.4
    })

    // Detection interval running 2 times per second (500ms) for ultra-low CPU consumption
    const detectionInterval = setInterval(async () => {
      if (isDetecting || isPausedRef.current || isTerminatedRef.current) return
      if (videoEl.readyState < 2) return

      try {
        isDetecting = true
        const detections = await faceapi.detectAllFaces(videoEl, detectorOptions)
        const count = detections.length

        setFaceCount(count)
        const now = Date.now()

        if (count === 1) {
          // 1 Face -> Normal State
          setFaceStatus('one_face')
          noFaceStart = null
          multipleFaceStart = null
        } else if (count === 0) {
          // 0 Faces -> Potential FACE_NOT_DETECTED
          setFaceStatus('no_face')
          multipleFaceStart = null

          if (isActiveRef.current) {
            if (!noFaceStart) {
              noFaceStart = now
            } else if (now - noFaceStart >= 2500) {
              // Face absent continuously for ~2.5 seconds -> trigger 1 violation
              triggerViolation(PROCTORING_EVENTS.FACE_NOT_DETECTED, {
                detail: 'No face detected in webcam feed for 2.5 seconds',
                confidence: 0.95
              })
              noFaceStart = null // Reset after trigger to avoid continuous alerts
            }
          }
        } else if (count >= 2) {
          // 2+ Faces -> Potential MULTIPLE_FACES
          setFaceStatus('multiple_faces')
          noFaceStart = null

          if (isActiveRef.current) {
            if (!multipleFaceStart) {
              multipleFaceStart = now
            } else if (now - multipleFaceStart >= 1500) {
              // Multiple faces detected continuously for ~1.5 seconds -> trigger 1 violation
              triggerViolation(PROCTORING_EVENTS.MULTIPLE_FACES, {
                detail: `${count} faces detected in webcam feed`,
                count,
                confidence: detections[0]?.score || 0.9
              })
              multipleFaceStart = null // Reset after trigger
            }
          }
        }
      } catch (err) {
        console.warn('[Proctoring] Face detection loop error:', err)
      } finally {
        isDetecting = false
      }
    }, 500)

    return () => {
      clearInterval(detectionInterval)
      videoEl.pause()
      videoEl.srcObject = null
    }
  }, [stream, mode.detectFace, isModelLoaded, isActive, triggerViolation])

  /**
   * 13. Cleanup on unmount or navigation
   */
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    mode,
    proctoringMode,
    isModelLoading,
    isModelLoaded,
    modelError,
    faceStatus,
    faceCount,
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
    requestCameraPermission,
    stopCamera,
    enterFullscreen,
    exitFullscreen,
    dismissWarning,
    triggerViolation,
    pauseProctoring,
    resumeProctoring
  }
}
