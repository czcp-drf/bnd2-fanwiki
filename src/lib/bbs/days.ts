export type BbsDayKey = `day${number}`

export type BbsDay = { key: BbsDayKey; label: string; range: string; start: string; end: string }

export function isWithinBbsDay(value: string, day: BbsDay) {
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp >= Date.parse(day.start) && timestamp <= Date.parse(day.end)
}

const KST_OFFSET = '+09:00'
const INITIAL_DAY: BbsDay = {
  key: 'day0',
  label: '0일차',
  range: '9/12',
  start: `2026-09-11T22:00:00${KST_OFFSET}`,
  end: `2026-09-13T02:00:00${KST_OFFSET}`,
}

function formatMonthDay(date: Date) {
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function createOperatingDays(): BbsDay[] {
  const days: BbsDay[] = [INITIAL_DAY]
  const startDate = new Date('2026-09-14T00:00:00Z')
  const finalDate = new Date('2026-10-04T00:00:00Z')
  let dayNumber = 1

  for (const date = new Date(startDate); date <= finalDate; date.setUTCDate(date.getUTCDate() + 1)) {
    // 매주 금요일은 서버 휴일이므로 일차를 부여하지 않습니다.
    if (date.getUTCDay() === 5) continue

    const nextDate = new Date(date)
    nextDate.setUTCDate(nextDate.getUTCDate() + 1)
    days.push({
      key: `day${dayNumber}`,
      label: `${dayNumber}일차`,
      range: `${formatMonthDay(date)} 18:00 ~ ${formatMonthDay(nextDate)} 03:00`,
      start: `${formatDate(date)}T16:00:00${KST_OFFSET}`,
      end: `${formatDate(nextDate)}T05:00:00${KST_OFFSET}`,
    })
    dayNumber += 1
  }

  return days
}

export const BBS_DAYS = createOperatingDays()
