import type { Metadata } from 'next'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: '일정',
  description: '봉누도2 서버 운영 일정 및 주요 이벤트',
}

// 날짜 상수
const OPERATION_START = new Date('2026-09-14T00:00:00+09:00')
const OPERATION_END = new Date('2026-10-04T23:59:59+09:00')

const preEvents = [
  {
    date: '2026-09-11',
    label: '9월 11일',
    title: '인게임 설명회',
    desc: '서버 참여 스트리머 대상 인게임 오리엔테이션',
    phase: 'pre',
  },
  {
    date: '2026-09-12',
    label: '9월 12일',
    title: '공무직 우선 접속',
    desc: '공무직 스트리머 사전 입장 — 교통 정리',
    phase: 'pre',
  },
  {
    date: '2026-09-13',
    label: '9월 13일',
    title: '전체 유저 베타 접속',
    desc: '전체 스트리머 사전 입장 — 캐릭터 커스터마이징 및 접속 문제 해결',
    phase: 'beta',
  },
  {
    date: '2026-09-14',
    label: '9월 14일',
    title: '공식 오픈',
    desc: '봉누도2 서버 정식 운영 시작',
    phase: 'open',
  },
]

function getServerStatus(now: Date): {
  label: string
  color: string
  dot: string
  detail: string
} {
  const nowKST = now

  // 오늘 날짜 비교를 위해 YYYY-MM-DD 문자열로
  const todayStr = nowKST.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })

  if (todayStr < '2026-09-11') {
    return {
      label: '오픈 전',
      color: 'text-zinc-400',
      dot: 'bg-zinc-600',
      detail: '서버 오픈 전 준비 중입니다.',
    }
  }
  if (todayStr === '2026-09-11') {
    return {
      label: '인게임 설명회',
      color: 'text-amber-400',
      dot: 'bg-amber-400',
      detail: '오늘 인게임 설명회가 진행됩니다.',
    }
  }
  if (todayStr === '2026-09-12') {
    return {
      label: '공무직 우선 접속',
      color: 'text-amber-400',
      dot: 'bg-amber-400',
      detail: '오늘은 공무직 스트리머 우선 접속일입니다.',
    }
  }
  if (todayStr === '2026-09-13') {
    return {
      label: '베타 접속',
      color: 'text-blue-400',
      dot: 'bg-blue-400',
      detail: '오늘은 전체 유저 베타 접속일입니다.',
    }
  }
  if (todayStr > '2026-10-04') {
    return {
      label: '운영 종료',
      color: 'text-zinc-500',
      dot: 'bg-zinc-600',
      detail: '봉누도2 서버 운영이 종료되었습니다.',
    }
  }
  // 운영 기간 내
  const dayOfWeek = nowKST.toLocaleDateString('en-US', { timeZone: 'Asia/Seoul', weekday: 'long' })
  if (dayOfWeek === 'Friday') {
    return {
      label: '휴일',
      color: 'text-zinc-400',
      dot: 'bg-zinc-600',
      detail: '오늘은 서버 휴일(금요일)입니다.',
    }
  }
  return {
    label: '운영 중',
    color: 'text-emerald-400',
    dot: 'bg-emerald-400 animate-pulse',
    detail: '서버가 오후 6시 ~ 오전 3시에 운영됩니다.',
  }
}

function buildCalendar() {
  // 9/14 ~ 10/4, 일요일 시작 달력
  const weeks: (null | { dateStr: string; day: number; month: number; isFriday: boolean; isInRange: boolean })[][] = []

  // 달력은 9월과 10월 두 달
  const months = [
    { year: 2026, month: 9, start: 14, end: 30 },
    { year: 2026, month: 10, start: 1, end: 4 },
  ]

  // 9월 달력 (9/14 ~ 9/30)
  const sepDays: { dateStr: string; day: number; month: number; isFriday: boolean; isInRange: boolean }[] = []
  for (let d = 1; d <= 30; d++) {
    const date = new Date(2026, 8, d) // month is 0-indexed
    const dateStr = `2026-09-${String(d).padStart(2, '0')}`
    sepDays.push({
      dateStr,
      day: d,
      month: 9,
      isFriday: date.getDay() === 5,
      isInRange: d >= 14,
    })
  }

  // 10월 달력 (10/1 ~ 10/4)
  const octDays: { dateStr: string; day: number; month: number; isFriday: boolean; isInRange: boolean }[] = []
  for (let d = 1; d <= 31; d++) {
    const date = new Date(2026, 9, d)
    if (date.getMonth() !== 9) break
    const dateStr = `2026-10-${String(d).padStart(2, '0')}`
    octDays.push({
      dateStr,
      day: d,
      month: 10,
      isFriday: date.getDay() === 5,
      isInRange: d <= 4,
    })
  }

  return { sepDays, octDays }
}

function MonthCalendar({
  year,
  month,
  days,
  todayStr,
}: {
  year: number
  month: number
  days: { dateStr: string; day: number; month: number; isFriday: boolean; isInRange: boolean }[]
  todayStr: string
}) {
  const monthLabel = `${year}년 ${month}월`
  // 해당 월 1일의 요일 (0=일)
  const firstDow = new Date(year, month - 1, 1).getDay()
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']

  // 달력 그리드용 패딩
  const allCells: (typeof days[0] | null)[] = [
    ...Array(firstDow).fill(null),
    ...days,
  ]
  // 6행 맞추기
  while (allCells.length % 7 !== 0) allCells.push(null)

  const weeks: (typeof days[0] | null)[][] = []
  for (let i = 0; i < allCells.length; i += 7) {
    weeks.push(allCells.slice(i, i + 7))
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-zinc-300">{monthLabel}</h3>
      <div className="grid grid-cols-7 text-center">
        {weekDays.map((d) => (
          <div key={d} className={cn('text-[11px] font-medium py-1', d === '금' ? 'text-zinc-500' : 'text-zinc-600')}>
            {d}
          </div>
        ))}
        {weeks.map((week, wi) =>
          week.map((cell, di) => {
            if (!cell) return <div key={`${wi}-${di}`} />
            const isToday = cell.dateStr === todayStr
            const isOpen = cell.isInRange
            const isFri = cell.isFriday

            return (
              <div
                key={cell.dateStr}
                className={cn(
                  'flex items-center justify-center rounded-md mx-0.5 my-0.5 h-8 text-xs font-medium',
                  !isOpen && 'text-zinc-700',
                  isOpen && !isFri && 'text-zinc-300 bg-zinc-800/50',
                  isOpen && isFri && 'text-zinc-500 bg-zinc-900 line-through decoration-zinc-600',
                  isToday && 'ring-1 ring-amber-400 text-amber-400 bg-amber-400/10',
                )}
              >
                {cell.day}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function SchedulePage() {
  const now = new Date()
  const todayStr = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
  const status = getServerStatus(now)
  const { sepDays, octDays } = buildCalendar()

  const daysUntilOpen = Math.ceil(
    (OPERATION_START.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  // 운영 일수 계산 (금요일 제외)
  let operationDays = 0
  const cur = new Date(OPERATION_START)
  while (cur <= OPERATION_END) {
    if (cur.getDay() !== 5) operationDays++
    cur.setDate(cur.getDate() + 1)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
      {/* 헤더 */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-white">일정</h1>
        <p className="text-sm text-zinc-500">봉누도2 서버 운영 일정 및 주요 이벤트</p>
      </div>

      {/* 현재 상태 배너 */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex items-center gap-4">
        <div className={cn('h-3 w-3 rounded-full shrink-0', status.dot)} />
        <div className="flex-1">
          <p className={cn('text-base font-bold', status.color)}>{status.label}</p>
          <p className="text-sm text-zinc-500 mt-0.5">{status.detail}</p>
        </div>
        {todayStr >= '2026-09-14' && todayStr <= '2026-10-04' && (
          <div className="hidden sm:block text-right">
            <p className="text-xs text-zinc-600">운영 시간</p>
            <p className="text-sm font-semibold text-zinc-300">오후 6시 ~ 오전 3시</p>
          </div>
        )}
        {todayStr < '2026-09-14' && daysUntilOpen > 0 && (
          <div className="hidden sm:block text-right">
            <p className="text-xs text-zinc-600">공식 오픈까지</p>
            <p className="text-sm font-semibold text-amber-400">D-{daysUntilOpen}</p>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* 좌: 사전 일정 타임라인 */}
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-white mb-4">사전 일정</h2>
            <ol className="relative border-l border-zinc-800 space-y-0">
              {preEvents.map((ev, i) => {
                const isPast = todayStr > ev.date
                const isToday = todayStr === ev.date
                const dotColor =
                  ev.phase === 'open'
                    ? 'bg-amber-400 ring-amber-400/30'
                    : ev.phase === 'beta'
                    ? 'bg-blue-400 ring-blue-400/30'
                    : isToday
                    ? 'bg-amber-400 ring-amber-400/30'
                    : 'bg-zinc-600 ring-zinc-600/30'

                return (
                  <li key={ev.date} className="pl-6 pb-8 last:pb-0 relative">
                    <span
                      className={cn(
                        'absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full ring-4 ring-zinc-950',
                        dotColor
                      )}
                    />
                    <div
                      className={cn(
                        'rounded-xl border p-4 transition-colors',
                        isPast && !isToday
                          ? 'border-zinc-800/50 bg-zinc-900/50 opacity-50'
                          : isToday
                          ? 'border-amber-400/30 bg-amber-400/5'
                          : ev.phase === 'open'
                          ? 'border-amber-400/20 bg-zinc-900'
                          : 'border-zinc-800 bg-zinc-900'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-xs text-zinc-500 mb-0.5">{ev.label}</p>
                          <p
                            className={cn(
                              'font-bold',
                              ev.phase === 'open' || isToday ? 'text-amber-400' : 'text-white'
                            )}
                          >
                            {ev.title}
                          </p>
                          <p className="text-sm text-zinc-500 mt-1">{ev.desc}</p>
                        </div>
                        {isToday && (
                          <span className="shrink-0 rounded-full bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
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
                  </li>
                )
              })}
            </ol>
          </div>

          {/* 운영 기간 요약 */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
            <h2 className="text-base font-bold text-white">운영 기간</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-zinc-800/50 p-3">
                <p className="text-xs text-zinc-500 mb-1">시작</p>
                <p className="text-sm font-bold text-white">9월 14일</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 p-3">
                <p className="text-xs text-zinc-500 mb-1">종료</p>
                <p className="text-sm font-bold text-white">10월 4일</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 p-3">
                <p className="text-xs text-zinc-500 mb-1">운영 시간</p>
                <p className="text-sm font-bold text-white">18:00 ~ 03:00</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 p-3">
                <p className="text-xs text-zinc-500 mb-1">총 운영일</p>
                <p className="text-sm font-bold text-white">{operationDays}일</p>
                <p className="text-[10px] text-zinc-600">금요일 제외</p>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 p-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-zinc-600 shrink-0" />
              <p className="text-xs text-zinc-500">
                <span className="text-zinc-400 font-medium">매주 금요일</span>은 서버 휴일입니다.
                (9월 18일, 9월 25일, 10월 2일)
              </p>
            </div>
          </div>
        </div>

        {/* 우: 달력 */}
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-6">
            <h2 className="text-base font-bold text-white">캘린더</h2>

            <MonthCalendar year={2026} month={9} days={sepDays} todayStr={todayStr} />
            <div className="border-t border-zinc-800" />
            <MonthCalendar year={2026} month={10} days={octDays} todayStr={todayStr} />

            {/* 범례 */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="h-4 w-4 rounded bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center text-[10px] text-zinc-300">1</span>
                운영일
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="h-4 w-4 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-500 line-through">5</span>
                휴일 (금요일)
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="h-4 w-4 rounded bg-amber-400/10 ring-1 ring-amber-400 flex items-center justify-center text-[10px] text-amber-400">오</span>
                오늘
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="h-4 w-4 rounded flex items-center justify-center text-[10px] text-zinc-700">3</span>
                운영 기간 외
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
