'use client'

import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

export default function DropdownPortal({ anchor, children }: {
  anchor: RefObject<HTMLDivElement | null>
  children: ReactNode
}) {
  const layer = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = layer.current
    const button = anchor.current?.querySelector<HTMLElement>('[data-dropdown-trigger]')
    if (!element || !button) return
    function position() {
      if (!element || !button) return
      const rect = button.getBoundingClientRect()
      const below = window.innerHeight - rect.bottom - 12
      const above = rect.top - 12
      const upward = below < Math.min(element.scrollHeight, 256) && above > below
      const width = Math.min(Math.max(rect.width, 80), window.innerWidth - 16)
      Object.assign(element.style, {
        width: `${width}px`,
        left: `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`,
        top: upward ? 'auto' : `${rect.bottom + 4}px`,
        bottom: upward ? `${window.innerHeight - rect.top + 4}px` : 'auto',
        maxHeight: `${Math.max(0, Math.min(256, upward ? above : below))}px`,
        visibility: 'visible',
      })
    }
    position()
    const observer = new ResizeObserver(position)
    observer.observe(button)
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', position, true)
    }
  }, [anchor])
  return createPortal(
    <div ref={layer} className="dropdown-scroll wiki-dropdown fixed z-[1000] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-xl" style={{ visibility: 'hidden' }}>
      {children}
    </div>, document.body,
  )
}
