const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const KST_TIME_ZONE = 'Asia/Seoul'

function toKstCalendarDate(value: Date) {
  return new Date(value.getTime() + KST_OFFSET_MS)
}

function createKstDate(year: number, month: number, day: number, hour: number) {
  return new Date(Date.UTC(year, month, day, hour) - KST_OFFSET_MS)
}

function getFinalServerShutdownAt() {
  const finalDate = process.env.BONGSTAGRAM_SERVER_FINAL_DATE?.trim()
  if (!finalDate || !/^\d{4}-\d{2}-\d{2}$/.test(finalDate)) return null
  const [year, month, day] = finalDate.split('-').map(Number)
  return createKstDate(year, month - 1, day, 3)
}

export function getStoryExpiration(postedAt: Date) {
  const kst = toKstCalendarDate(postedAt)
  const tomorrow = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() + 1))

  // 금요일에는 다음 날 서버 종료가 없으므로 토요일 03:00까지 유지한다.
  const daysUntilShutdown = tomorrow.getUTCDay() === 5 ? 2 : 1
  const nextShutdown = createKstDate(
    kst.getUTCFullYear(),
    kst.getUTCMonth(),
    kst.getUTCDate() + daysUntilShutdown,
    3,
  )
  const finalShutdown = getFinalServerShutdownAt()

  if (!finalShutdown) return nextShutdown
  return finalShutdown < nextShutdown ? finalShutdown : nextShutdown
}

export function isStoryVisible(storyExpiresAt: string | null, now = new Date()) {
  if (!storyExpiresAt) return false
  const expiresAt = new Date(storyExpiresAt)
  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= now) return false
  const finalShutdown = getFinalServerShutdownAt()
  return !finalShutdown || now < finalShutdown
}

export function getKstDateKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  const kst = toKstCalendarDate(date)
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}-${String(kst.getUTCDate()).padStart(2, '0')}`
}

export function formatKstDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST_TIME_ZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(value))
}
