'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Check, ChevronDown, Filter, X } from 'lucide-react'
import type { BbsCategory } from '@/lib/bbs/articles'
import type { BbsReporterOption } from '@/lib/bbs/data'
import type { BbsSortOrder } from '@/lib/bbs/data'
import { BBS_DAYS, type BbsDayKey } from '@/lib/bbs/days'
import { useRedPill } from '@/lib/context/RedPillContext'
import BbsLogo from './BbsLogo'

type Props = {
  activeCategory: BbsCategory
  activeReporterIds: string[]
  activeDay?: BbsDayKey
  activeSort: BbsSortOrder
  reporters: BbsReporterOption[]
  availableDayKeys: BbsDayKey[]
}

const BBS_FILTER_TIP_SEEN_KEY = 'bbs-filter-tip-seen'
const BBS_SCROLL_STATE_PREFIX = 'bbs-scroll-state:'

export default function BbsHeader({ activeCategory, activeReporterIds, activeDay, activeSort, reporters, availableDayKeys }: Props) {
  const router = useRouter()
  const { isRedPill } = useRedPill()
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const dayButtonRef = useRef<HTMLButtonElement>(null)
  const dayMenuRef = useRef<HTMLDivElement>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [reporterMenuOpen, setReporterMenuOpen] = useState(false)
  const [dayMenuOpen, setDayMenuOpen] = useState(false)
  const [showFilterTip, setShowFilterTip] = useState(false)
  const [selectedReporterIds, setSelectedReporterIds] = useState(activeReporterIds)
  const [selectedSort, setSelectedSort] = useState<BbsSortOrder>(activeSort)
  const [filterPosition, setFilterPosition] = useState<{ left: number; top: number; width: number } | null>(null)
  const [dayMenuPosition, setDayMenuPosition] = useState<{ left: number; top: number } | null>(null)

  useEffect(() => {
    try {
      const scrollStateKey = `${BBS_SCROLL_STATE_PREFIX}${window.location.pathname}${window.location.search}`
      if (!sessionStorage.getItem(BBS_FILTER_TIP_SEEN_KEY) && !sessionStorage.getItem(scrollStateKey)) {
        setShowFilterTip(true)
        sessionStorage.setItem(BBS_FILTER_TIP_SEEN_KEY, '1')
      }
    } catch {
      // Ignore storage restrictions and keep the BBS controls usable.
    }
  }, [])

  function dismissFilterTip() {
    setShowFilterTip(false)
    try {
      sessionStorage.setItem(BBS_FILTER_TIP_SEEN_KEY, '1')
    } catch {
      // Ignore storage restrictions.
    }
  }

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

  const positionDayMenu = useCallback(() => {
    const button = dayButtonRef.current
    if (!button) return
    const menuWidth = Math.min(256, Math.max(0, window.innerWidth - 32))
    const left = Math.min(Math.max(16, button.getBoundingClientRect().left), Math.max(16, window.innerWidth - menuWidth - 16))
    setDayMenuPosition({ left, top: button.getBoundingClientRect().bottom + 12 })
  }, [])

  useEffect(() => {
    if (!dayMenuOpen) return
    const frame = window.requestAnimationFrame(positionDayMenu)
    window.addEventListener('resize', positionDayMenu)
    window.addEventListener('scroll', positionDayMenu, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', positionDayMenu)
      window.removeEventListener('scroll', positionDayMenu, true)
    }
  }, [dayMenuOpen, positionDayMenu])

  useEffect(() => {
    if (!dayMenuOpen) return
    function handleOutsidePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (!dayMenuRef.current?.contains(target) && !dayButtonRef.current?.contains(target)) setDayMenuOpen(false)
    }
    document.addEventListener('pointerdown', handleOutsidePointerDown)
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown)
  }, [dayMenuOpen])

  function displayReporterName(reporter: BbsReporterOption) {
    return isRedPill && reporter.streamerName ? reporter.streamerName : reporter.name
  }

  function applyReporterFilter(nextReporterIds = selectedReporterIds, nextSortOrder = selectedSort) {
    const params = new URLSearchParams()
    if (activeCategory !== '전체') params.set('category', activeCategory)
    if (nextReporterIds.length) params.set('reporter', nextReporterIds.join(','))
    if (activeDay) params.set('day', activeDay)
    if (nextSortOrder === 'oldest') params.set('order', 'oldest')
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
        <div className="relative flex items-center gap-2">
          {showFilterTip && (
            <div onClick={dismissFilterTip} className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-56 cursor-pointer rounded-xl border border-[#e14b32]/30 bg-[var(--bbs-card)] px-3 py-2.5 text-xs font-semibold leading-relaxed text-[var(--bbs-text)] shadow-lg">
              <span className="absolute -top-1.5 right-5 h-3 w-3 rotate-45 border-l border-t border-[#e14b32]/30 bg-[var(--bbs-card)]" />
              <div className="relative flex items-start gap-2">
                <p className="flex-1">일차별 보기 등 다양한 필터를 활용해보세요.</p>
                <button type="button" onClick={dismissFilterTip} aria-label="필터 안내 닫기" className="shrink-0 cursor-pointer rounded-full p-0.5 text-[var(--bbs-subtle-text)] hover:bg-[var(--bbs-hover)] hover:text-[var(--bbs-text)]"><X size={13} /></button>
              </div>
            </div>
          )}
          <button
            type="button"
            aria-label="기사 필터"
            aria-expanded={filterOpen}
            ref={filterButtonRef}
            onClick={() => { dismissFilterTip(); setDayMenuOpen(false); setSelectedReporterIds(activeReporterIds); setSelectedSort(activeSort); setReporterMenuOpen(false); setFilterPosition(null); setFilterOpen((open) => !open) }}
            className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors ${activeReporterIds.length || activeSort === 'oldest' ? 'bg-[#e14b32]/15 text-[#e14b32]' : 'bg-[var(--bbs-muted)] text-[var(--bbs-subtle-text)] hover:bg-[var(--bbs-border)] hover:text-[var(--bbs-text)]'}`}
          >
            <Filter size={17} />
          </button>
          <button
            type="button"
            aria-label="기사 일차 선택"
            aria-expanded={dayMenuOpen}
            ref={dayButtonRef}
            onClick={() => { dismissFilterTip(); setFilterOpen(false); setDayMenuPosition(null); setDayMenuOpen((open) => !open) }}
            className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors ${activeDay ? 'bg-[#e14b32]/15 text-[#e14b32]' : 'bg-[var(--bbs-muted)] text-[var(--bbs-subtle-text)] hover:bg-[var(--bbs-border)] hover:text-[var(--bbs-text)]'}`}
          >
            <CalendarDays size={16} />
          </button>
        </div>
      </div>

      {dayMenuOpen && dayMenuPosition && (
        <div ref={dayMenuRef} className="fixed z-40 w-64 rounded-2xl border border-[var(--bbs-border)] bg-[var(--bbs-card)] p-3 shadow-xl" style={dayMenuPosition}>
          <p className="mb-2 px-1 text-xs font-bold text-[var(--bbs-text)]">기사 일차 선택</p>
          <div className="grid grid-cols-5 gap-1.5">
            <Link href={`/bbs?${new URLSearchParams({ ...(activeCategory !== '전체' ? { category: activeCategory } : {}), ...(activeReporterIds.length ? { reporter: activeReporterIds.join(',') } : {}), ...(activeSort === 'oldest' ? { order: 'oldest' } : {}) }).toString()}`} onClick={() => setDayMenuOpen(false)} className={`flex h-9 cursor-pointer items-center justify-center rounded-lg text-[11px] font-semibold ${!activeDay ? 'bg-[#e14b32] text-white' : 'text-[var(--bbs-subtle-text)] hover:bg-[var(--bbs-hover)] hover:text-[var(--bbs-text)]'}`}>전체</Link>
          {BBS_DAYS.filter((day) => availableDayKeys.includes(day.key)).map((day) => {
            const params = new URLSearchParams()
            params.set('day', day.key)
            if (activeCategory !== '전체') params.set('category', activeCategory)
            if (activeReporterIds.length) params.set('reporter', activeReporterIds.join(','))
            if (activeSort === 'oldest') params.set('order', 'oldest')
            return <Link key={day.key} href={`/bbs?${params.toString()}`} title={`${day.label} · ${day.range} (앞뒤 2시간 포함)`} onClick={() => setDayMenuOpen(false)} className={`flex h-9 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold ${activeDay === day.key ? 'bg-[#e14b32] text-white' : 'text-[var(--bbs-subtle-text)] hover:bg-[var(--bbs-hover)] hover:text-[var(--bbs-text)]'}`}>{day.label.replace('일차', '')}</Link>
          })}
          </div>
        </div>
      )}

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
                <button type="button" role="option" aria-selected={!selectedReporterIds.length} onClick={() => setSelectedReporterIds([])} className={`flex w-full cursor-pointer items-center rounded-lg px-3 py-2 max-md:py-3 text-left text-sm transition-colors ${!selectedReporterIds.length ? 'bg-[#e14b32]/12 font-semibold text-[#e14b32]' : 'text-[var(--bbs-text)] hover:bg-[var(--bbs-hover)]'}`}><span className="mr-2 flex h-4 w-4 items-center justify-center rounded border border-current">{!selectedReporterIds.length && <Check size={12} />}</span>모든 기자</button>
                {reporters.map((reporter) => { const selected = selectedReporterIds.includes(reporter.id); return <button key={reporter.id} type="button" role="option" aria-selected={selected} onClick={() => setSelectedReporterIds((current) => selected ? current.filter((id) => id !== reporter.id) : [...current, reporter.id])} className={`flex w-full cursor-pointer items-center rounded-lg px-3 py-2.5 max-md:py-3 text-left text-sm transition-colors ${selected ? 'bg-[#e14b32]/12 font-semibold text-[#e14b32]' : 'text-[var(--bbs-text)] hover:bg-[var(--bbs-hover)]'}`}><span className="mr-2 flex h-4 w-4 items-center justify-center rounded border border-current">{selected && <Check size={12} />}</span>{displayReporterName(reporter)}</button> })}
                {!reporters.length && <p className="px-3 py-3 text-sm text-[var(--bbs-subtle-text)]">등록된 기자가 없습니다.</p>}
              </div>
            )}
          </div>
          <div className="mt-3 text-xs text-[var(--bbs-subtle-text)]">
            <span>정렬</span>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {([['latest', '최신순'], ['oldest', '오래된순']] as const).map(([value, label]) => (
                <button key={value} type="button" onClick={() => setSelectedSort(value)} className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors ${selectedSort === value ? 'border-[#e14b32] bg-[#e14b32]/12 font-semibold text-[#e14b32]' : 'border-[var(--bbs-border)] bg-[var(--bbs-muted)] text-[var(--bbs-text)] hover:border-[#e14b32]/60'}`}>{label}</button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => { setSelectedReporterIds([]); setSelectedSort('latest'); applyReporterFilter([], 'latest') }} className="cursor-pointer rounded-lg px-3 py-2 text-xs text-[var(--bbs-subtle-text)] hover:bg-[var(--bbs-hover)] hover:text-[var(--bbs-text)]">초기화</button>
            <button type="button" onClick={() => applyReporterFilter()} className="flex cursor-pointer items-center gap-1 rounded-lg bg-[#e14b32] px-3 py-2 text-xs font-bold text-white hover:bg-[#c93b27]"><Check size={13} /> 적용</button>
          </div>
        </div>
      )}

    </header>
  )
}
