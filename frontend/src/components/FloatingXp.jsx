import React, { useState, useEffect } from 'react'

/**
 * FloatingXp Component
 * Displays a floating "+XP" reward badge that floats up and fades out.
 */
export default function FloatingXp({ xp = 100, trigger = false, onComplete }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (trigger) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        if (onComplete) onComplete()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [trigger, onComplete])

  if (!visible) return null

  return (
    <div className="floating-xp-bubble" aria-hidden="true">
      <span className="floating-sparkle">✨</span>
      <strong>+{xp} XP</strong>
    </div>
  )
}
