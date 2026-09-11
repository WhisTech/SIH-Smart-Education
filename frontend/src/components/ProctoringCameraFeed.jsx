import { useEffect, useRef } from 'react'
import { Camera, Lock, ShieldCheck, ShieldAlert, User, Users, UserX } from 'lucide-react'

/**
 * ProctoringCameraFeed
 * Renders a compact floating live webcam widget during active testing with Face status indicator.
 */
export default function ProctoringCameraFeed({ 
  stream, 
  warningCount = 0, 
  cameraStatus = 'granted',
  faceStatus = 'one_face', // 'one_face' | 'no_face' | 'multiple_faces' | 'disabled' | 'initializing'
  faceCount = 1,
  proctoringMode = 'STRICT'
}) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const isFaceEnabled = proctoringMode === 'STRICT' || proctoringMode === 'AI_FACE'

  return (
    <div className="proctoring-camera-feed" title="Live Proctoring Active">
      <div className="proctoring-video-container">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="proctoring-video-element"
          />
        ) : (
          <div className="proctoring-no-video">
            <Camera size={24} color="#94a3b8" />
            <span>Connecting...</span>
          </div>
        )}

        <div className="proctoring-status-pill">
          <span className="proctoring-pulse-dot" />
          <span className="proctoring-status-text">🟢 Camera Active</span>
        </div>
      </div>

      <div className="proctoring-feed-footer" style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '6px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: '10.5px', color: '#94a3b8' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38bdf8', fontWeight: 600 }}>
            <Lock size={11} /> Secure Mode
          </span>
          {warningCount === 0 ? (
            <span className="proctor-badge clean" style={{ fontSize: '10px', padding: '1px 6px' }}>
              Warnings: 0/3
            </span>
          ) : (
            <span className={`proctor-badge warning-${warningCount}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
              ⚠️ Warnings: {warningCount}/3
            </span>
          )}
        </div>

        {isFaceEnabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '4px' }}>
            {faceStatus === 'one_face' && (
              <span style={{ color: '#4ade80', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <User size={11} /> Face: Detected
              </span>
            )}
            {faceStatus === 'no_face' && (
              <span style={{ color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                <UserX size={11} /> ⚠️ Face not detected
              </span>
            )}
            {faceStatus === 'multiple_faces' && (
              <span style={{ color: '#fb923c', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                <Users size={11} /> ⚠️ Multiple faces ({faceCount})
              </span>
            )}
            {faceStatus === 'initializing' && (
              <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                👤 Face: Initializing...
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
