'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'

const typeOptions = [
  { value: '', label: '전체' },
  { value: 'war', label: '전쟁' },
  { value: 'crime', label: '범죄' },
  { value: 'political', label: '정치' },
  { value: 'social', label: '사회' },
  { value: 'accident', label: '사고' },
  { value: 'other', label: '기타' },
]

export default function EventTypeFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('type') ?? ''

  const update = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set('type', value)
      else params.delete('type')
      router.push(`/events?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 p-1 flex-wrap">
      {typeOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => update(opt.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            current === opt.value
              ? 'bg-amber-400 text-zinc-900'
              : 'text-zinc-400 hover:text-zinc-200'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
