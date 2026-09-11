'use client'

import { useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Calendar, AlignLeft, GalleryHorizontal } from 'lucide-react'
import { typeLabel, typeColor } from '@/lib/events'
import { cn } from '@/lib/utils'

export type TimelineEvent = {
  id: string
  title: string
  summary: string | null
  type: string | null
  occurred_at: string | null
  event_participants: Array<{
    characters: { id: string; name: string } | null
  }>
}

// 카드 고정 높이 (px)
const CARD_H = 176
// 커넥터 높이 (h-4 = 16px)
const CONNECTOR_H = 16
// 점 반지름 (w-3/h-3 = 12px → 반지름 6px)
const DOT_R = 6
// 가로 타임라인 내부 위아래 패딩 (py-6 = 24px)
const INNER_PY = 24
// 수평선 top = 패딩 + 카드 + 커넥터 + 점 반지름
const LINE_TOP = INNER_PY + CARD_H + CONNECTOR_H + DOT_R
// 선 아래 여백 (아래 카드 수용)
const BELOW_EXTRA = DOT_R + CONNECTOR_H + CARD_H

export default function TimelineView({ events }: { events: TimelineEvent[] }) {
  const [horizontal, setHorizontal] = useState(false)

  const { grouped, periods, undated } = useMemo(() => {
    const grouped: Record<string, TimelineEvent[]> = {}
    const undated: TimelineEvent[] = []
    for (const e of events) {
      if (!e.occurred_at) { undated.push(e); continue }
      const d = new Date(e.occurred_at)
      // YYYY-MM-DD 키로 일 단위 그룹핑
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(e)
    }
    const periods = Object.keys(grouped).sort()
    return { grouped, periods, undated }
  }, [events])

  return (
    <div className="space-y-5">
      {/* 보기 모드 토글 */}
      <div className="flex justify-end">
        <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-1 gap-0.5">
          <button
            onClick={() => setHorizontal(false)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              !horizontal ? 'bg-amber-400 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <AlignLeft size={13} />
            세로
          </button>
          <button
            onClick={() => setHorizontal(true)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              horizontal ? 'bg-amber-400 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <GalleryHorizontal size={13} />
            가로
          </button>
        </div>
      </div>

      {horizontal ? (
        /* 가로 모드: 전체 뷰포트 폭으로 탈출 */
        <div
          className="relative"
          style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}
        >
          <HorizontalTimeline grouped={grouped} periods={periods} undated={undated} />
        </div>
      ) : (
        <VerticalTimeline grouped={grouped} periods={periods} undated={undated} />
      )}
    </div>
  )
}

// YYYY-MM-DD → "2025년 3월 5일" 변환
function formatPeriod(key: string): string {
  const [y, m, d] = key.split('-')
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

// ── 세로 모드 ─────────────────────────────────────────────

function VerticalTimeline({
  grouped,
  periods,
  undated,
}: {
  grouped: Record<string, TimelineEvent[]>
  periods: string[]
  undated: TimelineEvent[]
}) {
  const allGroups: { key: string; label: string; isDimmed: boolean; events: TimelineEvent[] }[] = [
    ...periods.map(p => ({ key: p, label: formatPeriod(p), isDimmed: false, events: grouped[p] })),
    ...(undated.length ? [{ key: 'undated', label: '날짜 미정', isDimmed: true, events: undated }] : []),
  ]

  return (
    <div className="space-y-10">
      {allGroups.map(({ key, label, isDimmed, events }) => (
        <div key={key}>
          <div className="flex items-center gap-3 mb-5">
            <span className={cn('text-lg font-black', isDimmed ? 'text-zinc-600' : 'text-amber-400')}>
              {label}
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>
          <div className="space-y-4">
            {events.map(event => <VerticalCard key={event.id} event={event} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function VerticalCard({ event: e }: { event: TimelineEvent }) {
  const participants = e.event_participants.filter(p => p.characters)
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div className="h-3 w-3 rounded-full border-2 border-amber-400 bg-zinc-950 mt-2 z-10" />
        <div className="flex-1 w-px bg-zinc-700 mt-1" />
      </div>
      <div className="flex-1 pb-1">
        <Link
          href={`/events/${e.id}`}
          className="group block rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 transition-colors hover:border-amber-400/30 hover:bg-zinc-800/50"
        >
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {e.type && (
              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${typeColor[e.type]}`}>
                {typeLabel[e.type]}
              </span>
            )}
            {e.occurred_at && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Calendar size={10} />
                {new Date(e.occurred_at).toLocaleString('ko-KR', {
                  month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit', hour12: false,
                })}
              </span>
            )}
          </div>
          <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors leading-snug">
            {e.title}
          </h3>
          {e.summary && (
            <p className="mt-1 text-xs text-zinc-500 line-clamp-2 leading-relaxed">{e.summary}</p>
          )}
          {participants.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {participants.map((p, i) => (
                <span key={i} className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                  {p.characters!.name}
                </span>
              ))}
            </div>
          )}
        </Link>
      </div>
    </div>
  )
}

// ── 가로 모드 ─────────────────────────────────────────────

function HorizontalTimeline({
  grouped,
  periods,
  undated,
}: {
  grouped: Record<string, TimelineEvent[]>
  periods: string[]
  undated: TimelineEvent[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollStart = useRef(0)
  const hasDragged = useRef(false)

  function onMouseDown(e: React.MouseEvent) {
    isDragging.current = true
    hasDragged.current = false
    startX.current = e.clientX
    scrollStart.current = containerRef.current?.scrollLeft ?? 0
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing'
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current || !containerRef.current) return
    e.preventDefault()
    const dx = e.clientX - startX.current
    if (Math.abs(dx) > 4) hasDragged.current = true
    containerRef.current.scrollLeft = scrollStart.current - dx
  }

  function onMouseUp() {
    isDragging.current = false
    if (containerRef.current) containerRef.current.style.cursor = 'grab'
  }

  function onClickCapture(e: React.MouseEvent) {
    if (hasDragged.current) e.preventDefault()
  }

  // 마우스 휠 → 가로 스크롤
  function onWheel(e: React.WheelEvent) {
    if (!containerRef.current) return
    e.preventDefault()
    containerRef.current.scrollLeft += e.deltaY + e.deltaX
  }

  // 터치
  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    scrollStart.current = containerRef.current?.scrollLeft ?? 0
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!containerRef.current) return
    containerRef.current.scrollLeft = scrollStart.current - (e.touches[0].clientX - startX.current)
  }

  const allGroups: { key: string; label: string; isDimmed: boolean; events: TimelineEvent[] }[] = [
    ...periods.map(p => ({ key: p, label: formatPeriod(p), isDimmed: false, events: grouped[p] })),
    ...(undated.length ? [{ key: 'undated', label: '날짜 미정', isDimmed: true, events: undated }] : []),
  ]

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto overflow-y-hidden cursor-grab select-none rounded-xl border border-zinc-800/60 bg-zinc-950
        [&::-webkit-scrollbar]:hidden
        [scrollbar-width:none]"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClickCapture={onClickCapture}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      {/* 수평 기준선은 inner(스크롤 콘텐츠) 기준으로 그려야 스크롤해도 끊기지 않음 */}
      <div
        className="relative flex items-start min-w-max gap-0"
        style={{ padding: `${INNER_PY}px 32px ${BELOW_EXTRA + INNER_PY}px` }}
      >
        <div
          className="absolute left-0 right-0 h-px bg-zinc-700 pointer-events-none z-0"
          style={{ top: LINE_TOP }}
        />

        {(() => {
          let globalIdx = 0
          return allGroups.map(({ key, label, isDimmed, events }, gi) => (
            <div key={key} className="flex items-start">
              {/* 기간 마커 */}
              <div className="flex flex-col items-center shrink-0 mx-3">
                <div
                  className="flex flex-col justify-end items-center pb-1"
                  style={{ height: CARD_H }}
                >
                  <span className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs font-bold whitespace-nowrap bg-zinc-950 relative z-10',
                    isDimmed ? 'border-zinc-700 text-zinc-500' : 'border-amber-400/50 text-amber-400'
                  )}>
                    {label}
                  </span>
                </div>
                <div className="w-px bg-zinc-600" style={{ height: CONNECTOR_H }} />
                <div className={cn(
                  'rounded-full border-2 relative z-10',
                  isDimmed ? 'border-zinc-600 bg-zinc-950' : 'border-amber-500 bg-zinc-950'
                )} style={{ width: DOT_R * 2, height: DOT_R * 2 }} />
              </div>

              {/* 이벤트 카드들 — 홀짝 교차 배치 */}
              <div className="flex gap-3 items-start">
                {events.map(event => {
                  const isBelow = globalIdx % 2 === 1
                  globalIdx++
                  return <HorizontalCard key={event.id} event={event} isBelow={isBelow} />
                })}
              </div>

              {gi < allGroups.length - 1 && <div className="w-6 shrink-0" />}
            </div>
          ))
        })()}

        {/* 오른쪽 끝 여백 */}
        <div style={{ width: 32 }} />
      </div>
    </div>
  )
}

function HorizontalCard({ event: e, isBelow }: { event: TimelineEvent; isBelow: boolean }) {
  const participants = e.event_participants.filter(p => p.characters)
  const dateStr = e.occurred_at
    ? new Date(e.occurred_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    : '—'

  const card = (
    <Link
      href={`/events/${e.id}`}
      draggable={false}
      className="group w-full flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 transition-colors hover:border-amber-400/30 hover:bg-zinc-800/50 overflow-hidden"
      style={{ height: CARD_H }}
    >
      {e.type && (
        <span className={`self-start shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium mb-2 ${typeColor[e.type]}`}>
          {typeLabel[e.type]}
        </span>
      )}
      <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors line-clamp-3 leading-snug">
        {e.title}
      </h3>
      {e.summary && (
        <p className="mt-1 text-xs text-zinc-500 line-clamp-2 leading-relaxed">{e.summary}</p>
      )}
      {participants.length > 0 && (
        <div className="mt-auto pt-2 flex flex-wrap gap-1">
          {participants.slice(0, 3).map((p, i) => (
            <span key={i} className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400 whitespace-nowrap">
              {p.characters!.name}
            </span>
          ))}
          {participants.length > 3 && (
            <span className="text-xs text-zinc-600 self-center">+{participants.length - 3}</span>
          )}
        </div>
      )}
    </Link>
  )

  const dot = (
    <div
      className="rounded-full border-2 border-amber-400 bg-zinc-950 relative z-10"
      style={{ width: DOT_R * 2, height: DOT_R * 2 }}
    />
  )

  const connector = <div className="w-px bg-zinc-700" style={{ height: CONNECTOR_H }} />

  if (isBelow) {
    // 선 위: 빈 공간(카드 높이+커넥터) → 날짜 → 점 → 커넥터 → 카드
    return (
      <div className="flex flex-col items-center shrink-0" style={{ width: 192 }}>
        <div
          className="flex flex-col justify-end items-center pb-2"
          style={{ height: CARD_H + CONNECTOR_H }}
        >
          <p className="text-xs text-zinc-500 text-center whitespace-nowrap">{dateStr}</p>
        </div>
        {dot}
        {connector}
        {card}
      </div>
    )
  }

  // 선 위 (기본): 카드 → 커넥터 → 점 → 날짜
  return (
    <div className="flex flex-col items-center shrink-0" style={{ width: 192 }}>
      {card}
      {connector}
      {dot}
      <p className="mt-2 text-xs text-zinc-500 text-center whitespace-nowrap">{dateStr}</p>
    </div>
  )
}
