export type BbsDayKey = 'day0' | 'day1'

export const BBS_DAYS: Array<{ key: BbsDayKey; label: string; range: string; start: string; end: string }> = [
  { key: 'day0', label: '0일차', range: '9/12', start: '2026-09-11T22:00:00+09:00', end: '2026-09-13T02:00:00+09:00' },
  { key: 'day1', label: '1일차', range: '9/14 18:00 ~ 9/15 03:00', start: '2026-09-14T16:00:00+09:00', end: '2026-09-15T05:00:00+09:00' },
]
