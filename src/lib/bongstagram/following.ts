export const BONGSTAGRAM_FOLLOWING_KEY = 'bongstagram-following'
export const BONGSTAGRAM_FOLLOWING_EVENT = 'bongstagram-following-changed'

export function readBongstagramFollowing() {
  if (typeof window === 'undefined') return []
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(BONGSTAGRAM_FOLLOWING_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function readBongstagramFollowingSnapshot() {
  if (typeof window === 'undefined') return '[]'
  return window.localStorage.getItem(BONGSTAGRAM_FOLLOWING_KEY) ?? '[]'
}

export function writeBongstagramFollowing(characterIds: string[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(BONGSTAGRAM_FOLLOWING_KEY, JSON.stringify([...new Set(characterIds)]))
  window.dispatchEvent(new Event(BONGSTAGRAM_FOLLOWING_EVENT))
}
