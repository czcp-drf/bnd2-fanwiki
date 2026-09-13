'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Filter, LockKeyhole, X } from 'lucide-react'
import type { BbsCategory } from '@/lib/bbs/articles'
import type { BbsReporterOption } from '@/lib/bbs/data'
import { useRedPill } from '@/lib/context/RedPillContext'
import BbsLogo from './BbsLogo'

type Props = {
  activeCategory: BbsCategory
  activeReporterIds: string[]
  reporters: BbsReporterOption[]
}

export default function BbsHeader({ activeCategory, activeReporterIds, reporters }: Props) {
  const router = useRouter()
  const { isRedPill } = useRedPill()
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [reporterMenuOpen, setReporterMenuOpen] = useState(false)
  const [selectedReporterIds, setSelectedReporterIds] = useState(activeReporterIds)
  const [filterPosition, setFilterPosition] = useState<{ left: number; top: number; width: number } | null>(null)

  const positionFilterPanel = useCallback(() => {
    const button = filterButtonRef.current
    if (!button) return
    const panelWidth = Math.min(320, Math.max(0, window.innerWidth - 32))
    const left = Math.min(Math.max(16, button.getBoundingClientRect().left), Math.max(16, window.innerWidth - panelWidth - 16))
    setFilterPosition({ left, top: button.getBoundingClientRect().bottom + 12, width: panelWidth })
  }, [])

  useEffect(() => {
    if (!filterOpen) return
    const frame = window.requestAnimationFrame(positionFilterPanel)
    window.addEventListener('resize', positionFilterPanel)
    window.addEventListener('scroll', positionFilterPanel, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', positionFilterPanel)
      window.removeEventListener('scroll', positionFilterPanel, true)
    }
  }, [filterOpen, positionFilterPanel])

  function displayReporterName(reporter: BbsReporterOption) {
    return isRedPill && reporter.streamerName ? reporter.streamerName : reporter.name
  }

  function applyReporterFilter(nextReporterIds = selectedReporterIds) {
    const params = new URLSearchParams()
    if (activeCategory !== '전체') params.set('category', activeCategory)
    if (nextReporterIds.length) params.set('reporter', nextReporterIds.join(','))
    const query = params.toString()
    router.push(`/bbs${query ? `?${query}` : ''}`, { scroll: false })
    setFilterOpen(false)
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--bbs-border)] bg-[var(--bbs-surface)] px-5 py-5 sm:px-7 md:relative md:rounded-t-3xl md:px-8 md:py-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/bbs" aria-label="BBS 홈" className="cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e14b32]/50">
          <BbsLogo />
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="기사 필터"
            aria-expanded={filterOpen}
            ref={filterButtonRef}
            onClick={() => { setSelectedReporterIds(activeReporterIds); setReporterMenuOpen(false); setFilterPosition(null); setFilterOpen((open) => !open) }}
            className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors ${activeReporterIds.length ? 'bg-[#e14b32]/15 text-[#e14b32]' : 'bg-[var(--bbs-muted)] text-[var(--bbs-subtle-text)] hover:bg-[var(--bbs-border)] hover:text-[var(--bbs-text)]'}`}
          >
            <Filter size={17} />
          </button>
          <button
            type="button"
            aria-label="알림 기능 준비 중"
            title="알림 기능 준비 중"
            disabled
            className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full bg-[var(--bbs-muted)] text-[var(--bbs-subtle-text)] opacity-50"
          >
            <LockKeyhole size={16} />
          </button>
        </div>
      </div>

      {filterOpen && filterPosition && (
        <div className="fixed z-40 rounded-2xl border border-[var(--bbs-border)] bg-[var(--bbs-card)] p-4 shadow-xl" style={filterPosition} role="dialog" aria-label="기사 필터">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-[var(--bbs-text)]">기자별 기사 필터</h2>
            <button type="button" onClick={() => setFilterOpen(false)} aria-label="필터 닫기" className="cursor-pointer rounded-full p-1 text-[var(--bbs-subtle-text)] hover:bg-[var(--bbs-hover)] hover:text-[var(--bbs-text)]"><X size={16} /></button>
          </div>
          <div className="relative mt-3 text-xs text-[var(--bbs-subtle-text)]">
            <span>담당기자</span>
            <button type="button" aria-haspopup="listbox" aria-expanded={reporterMenuOpen} onClick={() => setReporterMenuOpen((open) => !open)} className="mt-1.5 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-[var(--bbs-border)] bg-[var(--bbs-muted)] px-3 py-2.5 text-left text-sm text-[var(--bbs-text)] transition-colors hover:border-[#e14b32]/60 focus:border-[#e14b32] focus:outline-none">
              <span className="truncate">{selectedReporterIds.length === 0 ? '모든 기자' : selectedReporterIds.length === 1 ? (() => { const reporter = reporters.find((item) => item.id === selectedReporterIds[0]); return reporter ? displayReporterName(reporter) : '선택한 기자 1명' })() : `선택한 기자 ${selectedReporterIds.length}명`}</span>
              <ChevronDown size={15} className={`shrink-0 transition-transform ${reporterMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {reporterMenuOpen && (
              <div role="listbox" aria-label="담당기자 선택" className="absolute inset-x-0 top-[4.25rem] z-50 max-h-52 overflow-y-auto rounded-xl border border-[var(--bbs-border)] bg-[var(--bbs-card)] p-1.5 shadow-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button type="button" role="option" aria-selected={!selectedReporterIds.length} onClick={() => setSelectedReporterIds([])} className={`flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${!selectedReporterIds.length ? 'bg-[#e14b32]/12 font-semibold text-[#e14b32]' : 'text-[var(--bbs-text)] hover:bg-[var(--bbs-hover)]'}`}><span className="mr-2 flex h-4 w-4 items-center justify-center rounded border border-current">{!selectedReporterIds.length && <Check size={12} />}</span>모든 기자</button>
                {reporters.map((reporter) => { const selected = selectedReporterIds.includes(reporter.id); return <button key={reporter.id} type="button" role="option" aria-selected={selected} onClick={() => setSelectedReporterIds((current) => selected ? current.filter((id) => id !== reporter.id) : [...current, reporter.id])} className={`flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${selected ? 'bg-[#e14b32]/12 font-semibold text-[#e14b32]' : 'text-[var(--bbs-text)] hover:bg-[var(--bbs-hover)]'}`}><span className="mr-2 flex h-4 w-4 items-center justify-center rounded border border-current">{selected && <Check size={12} />}</span>{displayReporterName(reporter)}</button> })}
                {!reporters.length && <p className="px-3 py-3 text-sm text-[var(--bbs-subtle-text)]">등록된 기자가 없습니다.</p>}
              </div>
            )}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => { setSelectedReporterIds([]); applyReporterFilter([]) }} className="cursor-pointer rounded-lg px-3 py-2 text-xs text-[var(--bbs-subtle-text)] hover:bg-[var(--bbs-hover)] hover:text-[var(--bbs-text)]">초기화</button>
            <button type="button" onClick={() => applyReporterFilter()} className="flex cursor-pointer items-center gap-1 rounded-lg bg-[#e14b32] px-3 py-2 text-xs font-bold text-white hover:bg-[#c93b27]"><Check size={13} /> 적용</button>
          </div>
        </div>
      )}

    </header>
  )
}
