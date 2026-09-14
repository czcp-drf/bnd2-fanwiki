const KST_TIME_ZONE = 'Asia/Seoul'

const dateTimeOptions: Intl.DateTimeFormatOptions = {
  timeZone: KST_TIME_ZONE,
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}

export function formatKstDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', dateTimeOptions).format(new Date(value))
}

export function formatKstDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST_TIME_ZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value))
}

export function formatKstMonthDay(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST_TIME_ZONE,
    month: 'long',
    day: 'numeric',
  }).format(new Date(value))
}

export function getKstDateKey(value: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value))
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  return `${year}-${month}-${day}`
}

export function toKstDateTimeLocal(value: string | null | undefined) {
  if (!value) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

export function kstDateTimeLocalToIso(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(`${value}:00+09:00`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
