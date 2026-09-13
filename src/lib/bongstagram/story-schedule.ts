const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const KST_TIME_ZONE = 'Asia/Seoul'

function toKstCalendarDate(value: Date) {
  return new Date(value.getTime() + KST_OFFSET_MS)
}

function getFinalServerShutdownAt() {
  const finalDate = process.env.BONGSTAGRAM_SERVER_FINAL_DATE?.trim()
  if (!finalDate || !/^\d{4}-\d{2}-\d{2}$/.test(finalDate)) return null
  const [year, month, day] = finalDate.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 3) - KST_OFFSET_MS)
}

export function getStoryExpiration(postedAt: Date) {
  const nextShutdown = new Date(postedAt.getTime() + 24 * 60 * 60 * 1000)
  const finalShutdown = getFinalServerShutdownAt()

  if (!finalShutdown) return nextShutdown
  return finalShutdown < nextShutdown ? finalShutdown : nextShutdown
}

export function isStoryVisible(storyPostedAt: string, now = new Date()) {
  const postedAt = new Date(storyPostedAt)
  if (Number.isNaN(postedAt.getTime())) return false
  const expiresAt = new Date(postedAt.getTime() + 24 * 60 * 60 * 1000)
  if (expiresAt <= now) return false
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
