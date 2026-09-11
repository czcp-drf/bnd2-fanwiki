'use client'

import { useState, useRef, useEffect, useId } from 'react'
import DropdownPortal from '@/components/ui/DropdownPortal'
import { ChevronDown } from 'lucide-react'
import { updateReportStatus } from './actions'
import { handleDropdownKeyDown } from '@/lib/dropdown-keyboard'

const statusOptions = [
  { value: 'pending', label: '대기중', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  { value: 'reviewing', label: '검토중', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { value: 'applied', label: '반영됨', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  { value: 'rejected', label: '반려됨', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
]

export default function ReportStatusSelect({ id, status }: { id: string; status: string }) {
  const [current, setCurrent] = useState(status)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) && !document.getElementById(listId)?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [listId])

  async function onChange(next: string) {
    setOpen(false)
    setLoading(true)
    setError('')
    const prev = current
    setCurrent(next)
    try {
      const result = await updateReportStatus(id, next)
      if (result?.error) {
        setCurrent(prev)
        setError(result.error)
      }
    } catch {
      setCurrent(prev)
      setError('상태 변경 중 오류가 발생했습니다.')
    }
    setLoading(false)
  }

  const opt = statusOptions.find((o) => o.value === current)

  return (
    <div className="inline-flex flex-col gap-1">
    <div ref={ref} className="relative inline-block" onKeyDown={(event) => { if (!loading) handleDropdownKeyDown(event, open, setOpen) }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget) && !document.getElementById(listId)?.contains(event.relatedTarget)) setOpen(false) }}>
      <button
        type="button"
        data-dropdown-trigger
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => !loading && setOpen((v) => !v)}
        disabled={loading}
        className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${opt?.color ?? ''}`}
      >
        <span>{opt?.label}</span>
        <ChevronDown size={10} className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <DropdownPortal anchor={ref}>
        <div id={listId} role="listbox" aria-label="제보 상태">
          {statusOptions.map((o) => (
            <button
              key={o.value}
              data-dropdown-option
              role="option"
              aria-selected={o.value === current}
              tabIndex={-1}
              type="button"
              onClick={() => { ref.current?.querySelector<HTMLButtonElement>('[data-dropdown-trigger]')?.focus(); void onChange(o.value) }}
              className={`w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-zinc-800 focus:bg-zinc-700 focus:outline-none ${
                o.value === current ? 'opacity-100' : 'opacity-60 hover:opacity-100'
              } ${o.color.split(' ')[0]}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        </DropdownPortal>
      )}
    </div>
    {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
