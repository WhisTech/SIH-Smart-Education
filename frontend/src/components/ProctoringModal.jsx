import { useEffect, useRef } from 'react'
import { 
  Camera, 
  AlertTriangle, 
  XCircle, 
  Maximize2, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  User,
  Users,
  UserX,
  Loader2
} from 'lucide-react'

/**
 * ProctoringModal
 * Multi-layer proctoring setup check, warning 1 & 2 alerts, and Warning 3 termination screen.
 */
export default function ProctoringModal({
  mode = 'pre_check', // 'pre_check' | 'warning' | 'terminated'
  proctoringMode = 'STRICT', // 'STRICT' | 'AI_FACE' | 'BASIC'
  isOpen = true,
  stream = null,
  cameraStatus = 'idle', // 'idle' | 'requesting' | 'granted' | 'denied'
  cameraError = '',
  fullscreenError = '',
  isModelLoading = false,
  isModelLoaded = false,
  faceStatus = 'one_face', // 'initializing' | 'one_face' | 'no_face' | 'multiple_faces' | 'disabled'
  faceCount = 1,
  warningCount = 1,
  violationType = 'TAB_SWITCH',
  onRequestCamera,
  onStartExam,
  onDismissWarning,
  onExitExam
}) {
  const previewVideoRef = useRef(null)

  // Attach camera stream to preview element in pre-check modal
  useEffect(() => {
    if (previewVideoRef.current && stream && mode === 'pre_check') {
      previewVideoRef.current.srcObject = stream
    }
  }, [stream, mode])

  if (!isOpen) return null

  const isFaceEnabled = proctoringMode === 'STRICT' || proctoringMode === 'AI_FACE'

  // Map violation types to human-readable titles
  const getViolationTitle = (type) => {
    switch (type) {
      case 'FACE_NOT_DETECTED':
        return 'Face Not Detected'
      case 'MULTIPLE_FACES':
        return 'Multiple Faces Detected'
      case 'TAB_SWITCH':
      case 'tab_switch':
        return 'Assessment window was left (Tab Switch)'
      case 'WINDOW_BLUR':
      case 'window_blur':
        return 'Assessment window lost focus'
      case 'FULLSCREEN_EXIT':
      case 'fullscreen_exit':
        return 'Exited Fullscreen Mode'
      case 'CAMERA_DISCONNECTED':
      case 'CAMERA_INTERRUPTED':
      case 'camera_disabled':
        return 'Camera Stream Interrupted / Disconnected'
      case 'CAMERA_DENIED':
        return 'Camera Permission Denied'
      default:
        return 'Security Violation Detected'
    }
  }

  const getViolationReason = (type) => {
    switch (type) {
      case 'FACE_NOT_DETECTED':
        return 'Your face was not visible in the camera feed for over 2.5 seconds.'
      case 'MULTIPLE_FACES':
        return 'Multiple people were detected in the camera feed.'
      case 'TAB_SWITCH':
      case 'tab_switch':
        return 'Assessment window was left.'
      case 'WINDOW_BLUR':
      case 'window_blur':
        return 'Browser window lost focus.'
      case 'FULLSCREEN_EXIT':
      case 'fullscreen_exit':
        return 'Fullscreen mode was exited.'
      case 'CAMERA_DISCONNECTED':
      case 'CAMERA_INTERRUPTED':
      case 'camera_disabled':
        return 'Camera stream was interrupted or hardware disconnected.'
      default:
        return 'Unauthorized browser action detected.'
    }
  }

  return (
    <div className="proctoring-modal-backdrop">
      <div className={`proctoring-modal-card mode-${mode}`}>

        {/* 1. PRE-EXAM SYSTEM & CAMERA CHECK */}
        {mode === 'pre_check' && (
          <div className="proctoring-precheck-content">
            <div className="proctoring-modal-header">
              <span className="proctor-icon-badge">
                <Shield size={28} color="#0284c7" />
              </span>
              <h2>SECURE ASSESSMENT</h2>
              <p>
                This official assessment uses browser-native proctoring with local AI face monitoring.
              </p>
            </div>

            <div className="proctoring-preview-box">
              {stream ? (
                <div className="preview-active">
                  <video ref={previewVideoRef} autoPlay playsInline muted className="preview-video" />
                  
                  {/* Status Overlay Pill */}
                  <div className="preview-live-badge" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span><CheckCircle2 size={13} style={{ display: 'inline', marginRight: '4px' }} /> 🟢 Camera Active</span>
                    {isFaceEnabled && (
                      <span style={{ fontSize: '11px', color: faceStatus === 'one_face' ? '#4ade80' : faceStatus === 'multiple_faces' ? '#fb923c' : '#f87171' }}>
                        {isModelLoading ? (
                          <>⏳ Initializing AI face monitoring...</>
                        ) : faceStatus === 'one_face' ? (
                          <>🟢 One face detected</>
                        ) : faceStatus === 'multiple_faces' ? (
                          <>⚠️ Multiple faces detected ({faceCount})</>
                        ) : (
                          <>⚠️ Face not detected</>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="preview-placeholder">
                  <Camera size={36} color="#64748b" />
                  <p>{cameraStatus === 'requesting' ? 'Requesting camera access...' : 'Webcam preview will appear here once granted'}</p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="proctoring-alert alert-danger">
                <AlertTriangle size={18} />
                <span>{cameraError}</span>
              </div>
            )}

            {fullscreenError && (
              <div className="proctoring-alert alert-danger">
                <AlertTriangle size={18} />
                <span>{fullscreenError}</span>
              </div>
            )}

            {/* Checklist */}
            <div className="proctoring-checklist">
              <div className={`check-item ${cameraStatus === 'granted' ? 'passed' : 'pending'}`}>
                <span className="check-icon">{cameraStatus === 'granted' ? '✓' : '1'}</span>
                <div>
                  <strong>Camera Permission:</strong>
                  <span>{cameraStatus === 'granted' ? ' ✓ Camera detected & permission granted' : ' Camera permission required'}</span>
                </div>
              </div>

              <div className="check-item passed">
                <span className="check-icon">✓</span>
                <div>
                  <strong>Proctoring Engine:</strong>
                  <span> ✓ Proctoring enabled (Visibility & Focus monitoring)</span>
                </div>
              </div>

              <div className="check-item passed">
                <span className="check-icon">✓</span>
                <div>
                  <strong>Secure Environment:</strong>
                  <span> ✓ Secure fullscreen required (Max 3 warnings allowed)</span>
                </div>
              </div>

              {isFaceEnabled && (
                <div className={`check-item ${isModelLoaded ? 'passed' : 'pending'}`}>
                  <span className="check-icon">{isModelLoaded ? '✓' : '⏳'}</span>
                  <div>
                    <strong>AI Face Monitoring:</strong>
                    <span>{isModelLoaded ? ' ✓ AI face monitoring enabled (Local model ready)' : ' ⏳ Initializing AI face monitoring...'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="proctoring-modal-actions">
              {cameraStatus !== 'granted' ? (
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={onRequestCamera}
                  disabled={cameraStatus === 'requesting'}
                  style={{ width: '100%' }}
                >
                  <Camera size={18} />
                  {cameraStatus === 'requesting' ? 'Connecting Camera...' : 'Grant Camera Access'}
                </button>
              ) : isFaceEnabled && isModelLoading ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-lg"
                  disabled
                  style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Loader2 size={18} className="animate-spin" />
                  <span>⏳ Initializing AI face monitoring...</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-success btn-lg"
                  onClick={onStartExam}
                  style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Maximize2 size={18} />
                  <span>Enter Fullscreen & Begin Assessment</span>
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. WARNING 1 OR WARNING 2 DIALOG */}
        {mode === 'warning' && (
          <div className="proctoring-warning-content">
            <div className="proctoring-modal-header warning">
              <span className={`proctor-icon-badge ${warningCount === 2 ? 'danger' : 'warn'}`}>
                <AlertTriangle size={32} />
              </span>
              <h2 style={{ color: warningCount === 2 ? '#dc2626' : '#d97706' }}>
                WARNING {warningCount}/3
              </h2>
              <p style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b', marginTop: '6px' }}>
                Security violation detected.
              </p>
            </div>

            <div className={`proctoring-alert ${warningCount === 2 ? 'alert-danger' : 'alert-warning'}`}>
              <div style={{ width: '100%' }}>
                <div style={{ marginBottom: '6px' }}>
                  <strong>Reason:</strong> "{getViolationReason(violationType)}"
                </div>
                <div style={{ fontSize: '13px' }}>
                  {warningCount === 2
                    ? 'WARNING 2/3: One more security violation will terminate this assessment.'
                    : 'This incident has been recorded. (Warning 1 of 3)'}
                </div>
              </div>
            </div>

            <div className="proctoring-rules-reminder">
              <p><strong>Assessment Integrity Rules:</strong></p>
              <ul>
                <li>Remain visible in front of the webcam at all times.</li>
                <li>Ensure only one person is present in the camera view.</li>
                <li>Remain in full-screen view without switching tabs or windows.</li>
              </ul>
            </div>

            <div className="proctoring-modal-actions">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={onDismissWarning}
                style={{ width: '100%' }}
              >
                Resume Assessment
              </button>
            </div>
          </div>
        )}

        {/* 3. TERMINATION NOTICE (WARNING 3 REACHED) */}
        {mode === 'terminated' && (
          <div className="proctoring-terminated-content">
            <div className="proctoring-modal-header danger">
              <span className="proctor-icon-badge danger">
                <XCircle size={36} color="#dc2626" />
              </span>
              <h2 style={{ color: '#dc2626' }}>ASSESSMENT TERMINATED</h2>
              <p style={{ fontSize: '15px', color: '#334155', marginTop: '6px', fontWeight: '600' }}>
                Maximum proctoring violations reached (3/3).
              </p>
            </div>

            <div className="proctoring-alert alert-danger">
              <p style={{ margin: 0 }}>
                Your assessment has been terminated and recorded for review due to repeated security violations (Reason: "{getViolationReason(violationType)}").
              </p>
            </div>

            <div style={{ margin: '20px 0', fontSize: '13.5px', color: '#64748b', textAlign: 'center' }}>
              Further actions for this attempt are locked. Please return to the dashboard to review your status.
            </div>

            <div className="proctoring-modal-actions">
              <button
                type="button"
                className="btn btn-outline btn-lg"
                onClick={onExitExam}
                style={{ width: '100%' }}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
