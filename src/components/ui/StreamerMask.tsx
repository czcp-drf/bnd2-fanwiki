'use client'

import { useRedPill } from '@/lib/context/RedPillContext'

/**
 * 빨간약 ON: children 표시
 * 빨간약 OFF: fallback 표시 (없으면 null)
 */
export function StreamerReveal({
  children,
  fallback = null,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { isRedPill } = useRedPill()
  return <>{isRedPill ? children : fallback}</>
}

/**
 * 빨간약 ON: 그대로 표시
 * 빨간약 OFF: blur 처리
 */
export function StreamerBlur({ children }: { children: React.ReactNode }) {
  const { isRedPill } = useRedPill()
  return (
    <span
      className={
        isRedPill
          ? ''
          : 'blur-sm select-none pointer-events-none transition-all'
      }
    >
      {children}
    </span>
  )
}
