'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const sections = [
  { id: 'what-is-gta-rp', label: 'GTA RP란?' },
  { id: 'what-is-bnd2', label: '봉누도2 소개' },
  { id: 'how-to-watch', label: '시청 방법' },
  { id: 'pov-guide', label: '시점 전환 가이드' },
  { id: 'organizations', label: '주요 세력' },
  { id: 'faq', label: '자주 묻는 질문' },
]

export default function TableOfContents() {
  const [active, setActive] = useState('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id)
          }
        }
      },
      { rootMargin: '-20% 0% -70% 0%' }
    )

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <nav className="space-y-1">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">목차</p>
      {sections.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className={cn(
            'block rounded-md px-3 py-1.5 text-sm transition-colors',
            active === id
              ? 'bg-amber-400/10 text-amber-400 font-medium'
              : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          {label}
        </a>
      ))}
    </nav>
  )
}
