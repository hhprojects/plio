'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

const EASING = {
  reveal: 'cubic-bezier(0.16, 1, 0.3, 1)',
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const

type Easing = keyof typeof EASING

interface UseInViewOptions extends IntersectionObserverInit {
  /** Default stagger interval in ms between items (default: 80) */
  staggerInterval?: number
  /** Base animation duration in ms (default: 600) */
  duration?: number
  /** Easing preset (default: 'reveal') */
  easing?: Easing
}

/**
 * Returns CSS style props for a stagger-animated element.
 *
 * Before the section is in view, elements are hidden (opacity 0, translated down).
 * Once in view, each element animates in with a delay based on its stagger index.
 */
function buildStaggerStyle(
  inView: boolean,
  index: number,
  interval: number,
  duration: number,
  easing: Easing
): CSSProperties {
  const delay = index * interval
  return {
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity ${duration}ms ${EASING[easing]} ${delay}ms, transform ${duration}ms ${EASING[easing]} ${delay}ms`,
  }
}

export function useInView(options?: UseInViewOptions) {
  const {
    staggerInterval = 80,
    duration = 600,
    easing = 'reveal',
    ...observerOptions
  } = options ?? {}

  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.1, ...observerOptions }
    )

    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Get CSS style props for a staggered child element.
   *
   * @param index - The item's position in the stagger sequence (0-based)
   * @param overrides - Optional per-item overrides for duration/easing
   */
  const getStaggerStyle = useCallback(
    (
      index: number,
      overrides?: { duration?: number; easing?: Easing }
    ): CSSProperties => {
      return buildStaggerStyle(
        inView,
        index,
        staggerInterval,
        overrides?.duration ?? duration,
        overrides?.easing ?? easing
      )
    },
    [inView, staggerInterval, duration, easing]
  )

  return { ref, inView, getStaggerStyle }
}
