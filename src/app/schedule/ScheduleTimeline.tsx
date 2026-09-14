'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ScheduleEvent = {
  date: string
  label: string
  title: string
  desc: string
  phase: 'pre' | 'beta' | 'open'
}

function ScheduleEventCard({ event, todayStr }: { event: ScheduleEvent; todayStr: string }) {
  const isPast = todayStr > event.date
  const isToday = todayStr === event.date
  const dotColor = event.phase === 'open' || (event.phase !== 'beta' && isToday)
    ? 'bg-amber-400 ring-amber-400/30'
    : 'bg-zinc-600 ring-zinc-600/30'

  return (
    <div role="listitem" className="relative pl-6 pb-8 last:pb-0">
      <span className={cn('absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full ring-4 ring-zinc-950', dotColor)} />
      <div
        className={cn(
          'rounded-xl border p-4 transition-colors',
          isPast && !isToday
            ? 'border-zinc-800/50 bg-zinc-900/50 opacity-50'
            : isToday
            ? 'border-amber-400/30 bg-amber-400/5'
            : event.phase === 'open'
            ? 'border-amber-400/20 bg-zinc-900'
            : 'border-zinc-800 bg-zinc-900'
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="mb-0.5 text-xs text-zinc-500">{event.label}</p>
            <p className={cn('font-bold', event.phase === 'open' || isToday ? 'text-amber-400' : 'text-white')}>
              {event.title}
            </p>
            <p className="mt-1 text-sm text-zinc-500">{event.desc}</p>
          </div>
          {isToday && (
            <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
              오늘
            </span>
          )}
          {isPast && !isToday && (
            <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-600">
              완료
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function CollapsedPastEvents({ events, onToggle }: { events: ScheduleEvent[]; onToggle: () => void }) {
  return (
    <li className="relative pl-6 pb-8">
      <span className="absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full bg-zinc-600 ring-4 ring-zinc-950" />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded="false"
        className="relative min-h-[76px] w-full cursor-pointer text-left"
      >
        {events.slice(0, 3).map((event, index) => (
          <span
            key={event.date}
            aria-hidden="true"
            className="absolute inset-x-0 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 opacity-30"
            style={{ top: `${(index + 1) * 5}px`, transform: `scale(${1 - (index + 1) * 0.015})` }}
          >
            <span className="text-xs text-zinc-600">{event.label}</span>
          </span>
        ))}
        <span className="relative z-10 flex min-h-[76px] items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 opacity-80 transition-colors hover:border-zinc-700 hover:bg-zinc-800">
          <span>
            <span className="block text-sm font-bold text-zinc-300">지난 일정 {events.length}개</span>
            <span className="mt-1 block text-xs text-zinc-600">클릭하면 일정 펼치기</span>
          </span>
          <ChevronDown size={18} className="shrink-0 text-zinc-500" />
        </span>
      </button>
    </li>
  )
}

export default function ScheduleTimeline({ events, todayStr }: { events: ScheduleEvent[]; todayStr: string }) {
  const [pastExpanded, setPastExpanded] = useState(false)
  const pastEvents = events.filter((event) => todayStr > event.date)
  const upcomingEvents = events.filter((event) => todayStr <= event.date)

  return (
    <ol className="relative space-y-0 border-l border-zinc-800">
      {pastEvents.length > 0 && !pastExpanded && (
        <CollapsedPastEvents events={pastEvents} onToggle={() => setPastExpanded(true)} />
      )}
      {pastEvents.length > 0 && pastExpanded && (
        <div role="listitem">
          {pastEvents.map((event) => <ScheduleEventCard key={event.date} event={event} todayStr={todayStr} />)}
          <button
            type="button"
            onClick={() => setPastExpanded(false)}
            className="mb-8 ml-6 flex cursor-pointer items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            지난 일정 접기
            <ChevronUp size={14} />
          </button>
        </div>
      )}
      {upcomingEvents.map((event) => <ScheduleEventCard key={event.date} event={event} todayStr={todayStr} />)}
    </ol>
  )
}
