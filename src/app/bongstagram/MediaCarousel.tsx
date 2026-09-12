'use client'

import { Children, useId, useRef, useState, type ReactNode } from 'react'

function ArrowDisc({ direction }: { direction: 'left' | 'right' }) {
  const maskId = useId()
  return (
    <svg width="32" height="32" viewBox="0 0 36 36" aria-hidden="true">
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
          <circle cx="18" cy="18" r="18" fill="white" />
          <path d={direction === 'left' ? 'M21 11 L14 18 L21 25' : 'M15 11 L22 18 L15 25'} fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </mask>
      </defs>
      <circle cx="18" cy="18" r="18" fill="#fff" fillOpacity="0.8" mask={`url(#${maskId})`} />
    </svg>
  )
}

export default function MediaCarousel({ children }: { children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const drag = useRef<{ id: number; x: number; scroll: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const count = Children.count(children)

  function finishDrag(element: HTMLDivElement, pointerId: number, clientX: number, cancelled = false) {
    const current = drag.current
    if (!current || current.id !== pointerId) return
    drag.current = null
    if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId)
    element.style.scrollSnapType = ''
    if (!current.moved) return
    suppressClick.current = true
    const width = element.clientWidth
    if (!width) return
    const distance = current.x - clientX
    const start = Math.round(current.scroll / width)
    const target = Math.max(0, Math.min(count - 1, start + (!cancelled && Math.abs(distance) >= 6 ? Math.sign(distance) : 0)))
    element.scrollTo({ left: target * width, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  function move(direction: number) {
    const element = track.current
    if (!element) return
    const target = Math.max(0, Math.min(count - 1, Math.round(element.scrollLeft / element.clientWidth) + direction))
    element.scrollTo({ left: target * element.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  return (
    <div className="relative min-w-0" role="region" aria-label="게시물 미디어">
      <div
        ref={track}
        tabIndex={count > 1 ? 0 : undefined}
        onDragStart={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          suppressClick.current = false
          if (count < 2 || event.pointerType !== 'mouse' || event.button !== 0) return
          drag.current = { id: event.pointerId, x: event.clientX, scroll: event.currentTarget.scrollLeft, moved: false }
        }}
        onPointerMove={(event) => {
          const current = drag.current
          if (!current || current.id !== event.pointerId) return
          const delta = event.clientX - current.x
          if (!current.moved && Math.abs(delta) < 6) return
          if (!current.moved) {
            current.moved = true
            event.currentTarget.setPointerCapture(event.pointerId)
            event.currentTarget.style.scrollSnapType = 'none'
          }
          event.preventDefault()
          event.currentTarget.scrollLeft = current.scroll - delta
        }}
        onPointerUp={(event) => finishDrag(event.currentTarget, event.pointerId, event.clientX)}
        onPointerCancel={(event) => finishDrag(event.currentTarget, event.pointerId, event.clientX, true)}
        onPointerLeave={() => { if (drag.current && !drag.current.moved) drag.current = null }}
        onClickCapture={(event) => {
          if (suppressClick.current) {
            event.preventDefault()
            event.stopPropagation()
            suppressClick.current = false
          }
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault()
            move(event.key === 'ArrowLeft' ? -1 : 1)
          }
        }}
        onScroll={(event) => {
          const element = event.currentTarget
          if (element.clientWidth) setIndex(Math.round(element.scrollLeft / element.clientWidth))
        }}
        className="flex w-full select-none snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {count > 1 && index > 0 && (
        <button type="button" onClick={() => move(-1)} aria-label="이전 미디어" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-white">
          <ArrowDisc direction="left" />
        </button>
      )}
      {count > 1 && index < count - 1 && (
        <button type="button" onClick={() => move(1)} aria-label="다음 미디어" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-white">
          <ArrowDisc direction="right" />
        </button>
      )}
    </div>
  )
}
