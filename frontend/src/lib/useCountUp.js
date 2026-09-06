import { useState, useEffect } from 'react'

/**
 * useCountUp Hook
 * Smoothly counts from 0 (or start) to the target end number with an ease-out curve.
 * 
 * @param {number} end - Target value
 * @param {number} duration - Animation duration in ms (default 1200ms)
 * @param {number} start - Starting value (default 0)
 * @returns {number} Current animated value
 */
export function useCountUp(end = 0, duration = 1200, start = 0) {
  const [count, setCount] = useState(start)

  useEffect(() => {
    const endVal = Number(end) || 0
    const startVal = Number(start) || 0

    if (endVal === startVal) {
      setCount(endVal)
      return
    }

    let startTime = null
    let animationFrameId = null

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic curve: 1 - Math.pow(1 - progress, 3)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startVal + (endVal - startVal) * easeOut)

      setCount(current)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      } else {
        setCount(endVal)
      }
    }

    animationFrameId = requestAnimationFrame(step)

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [end, duration, start])

  return count
}
