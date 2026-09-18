export const BBS_READ_ARTICLES_KEY = 'bbs-read-articles'

export function getReadArticleIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()

  try {
    const stored = JSON.parse(window.localStorage.getItem(BBS_READ_ARTICLES_KEY) ?? '{}')
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return new Set()
    return new Set(Object.keys(stored))
  } catch {
    return new Set()
  }
}

export function markArticleAsRead(articleId: string) {
  if (typeof window === 'undefined') return

  try {
    const stored = JSON.parse(window.localStorage.getItem(BBS_READ_ARTICLES_KEY) ?? '{}')
    const reads = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored as Record<string, number> : {}
    reads[articleId] = Date.now()

    const limitedReads = Object.fromEntries(
      Object.entries(reads).sort(([, first], [, second]) => second - first).slice(0, 1000),
    )
    window.localStorage.setItem(BBS_READ_ARTICLES_KEY, JSON.stringify(limitedReads))
    window.dispatchEvent(new CustomEvent('bbs-read-articles-changed'))
  } catch {
    // localStorage가 차단된 환경에서도 기사 열람 자체는 계속 동작합니다.
  }
}
