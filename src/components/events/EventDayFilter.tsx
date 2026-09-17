'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarDays } from 'lucide-react'
import { BBS_DAYS, type BbsDayKey } from '@/lib/bbs/days'

export default function EventDayFilter({ availableDayKeys }: { availableDayKeys: BbsDayKey[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)
  const current = searchParams.get('day') ?? ''
  const visibleDays = BBS_DAYS.filter((day) => availableDayKeys.includes(day.key))

  const positionMenu = useCallback(() => {
    const button = buttonRef.current
    if (!button) return
    const menuWidth = Math.min(256, Math.max(0, window.innerWidth - 32))
    const left = Math.min(Math.max(16, button.getBoundingClientRect().left), Math.max(16, window.innerWidth - menuWidth - 16))
    setPosition({ left, top: button.getBoundingClientRect().bottom + 12 })
  }, [])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(positionMenu)
    window.addEventListener('resize', positionMenu)
    window.addEventListener('scroll', positionMenu, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', positionMenu)
      window.removeEventListener('scroll', positionMenu, true)
    }
  }, [open, positionMenu])

  useEffect(() => {
    if (!open) return
    function handleOutsidePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handleOutsidePointerDown)
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown)
  }, [open])

  function update(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('day', value)
    else params.delete('day')
    const query = params.toString()
    router.push(`/events${query ? `?${query}` : ''}`, { scroll: false })
    setOpen(false)
  }

  const selectedDayLabel = current ? BBS_DAYS.find((day) => day.key === current)?.label.replace('일차', '') : null

  return (
    <>
      <button type="button" aria-label="사건 일차 선택" aria-expanded={open} ref={buttonRef} onClick={() => { setPosition(null); setOpen((value) => !value) }} className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors ${current ? 'bg-amber-400/15 text-amber-400' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}>
        {selectedDayLabel ? <span className="text-sm font-bold leading-none">{selectedDayLabel}</span> : <CalendarDays size={16} />}
      </button>
      {open && position && (
        <div ref={menuRef} className="fixed z-40 w-64 rounded-2xl border border-zinc-800 bg-zinc-900 p-3 shadow-xl" style={position}>
          <p className="mb-2 px-1 text-xs font-bold text-zinc-200">사건 일차 선택</p>
          <div className="grid grid-cols-5 gap-1.5">
            <button type="button" onClick={() => update('')} className={`flex h-9 cursor-pointer items-center justify-center rounded-lg text-[11px] font-semibold ${!current ? 'bg-amber-400 text-zinc-900' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}>전체</button>
            {visibleDays.map((day) => (
              <button key={day.key} type="button" onClick={() => update(day.key)} title={`${day.label} · ${day.range}`} className={`flex h-9 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold ${current === day.key ? 'bg-amber-400 text-zinc-900' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}>{day.label.replace('일차', '')}</button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
