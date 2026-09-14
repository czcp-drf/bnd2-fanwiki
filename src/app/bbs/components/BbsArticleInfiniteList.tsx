'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import type { BbsArticle } from '@/lib/bbs/articles'
import type { BbsDayKey } from '@/lib/bbs/days'
import type { BbsSortOrder } from '@/lib/bbs/data'
import { getBbsArticlesPageAction } from '../actions'
import BbsArticleCard, { BBS_SCROLL_STATE_PREFIX } from './BbsArticleCard'

type Props = {
  initialArticles: BbsArticle[]
  total: number
  totalPages: number
  category: string
  reporterIds: string[]
  day?: BbsDayKey
  sortOrder: BbsSortOrder
}

export default function BbsArticleInfiniteList({ initialArticles, total, totalPages, category, reporterIds, day, sortOrder }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const listParams = useMemo(() => {
    const params = new URLSearchParams()
    if (category !== '전체') params.set('category', category)
    if (reporterIds.length) params.set('reporter', reporterIds.join(','))
    if (day) params.set('day', day)
    if (sortOrder === 'oldest') params.set('order', 'oldest')
    return params.toString()
  }, [category, day, reporterIds, sortOrder])

  const query = useInfiniteQuery({
    queryKey: ['bbs-articles', category, [...reporterIds].sort(), day ?? null, sortOrder],
    queryFn: ({ pageParam }) => getBbsArticlesPageAction(category === '전체' ? undefined : category, reporterIds, pageParam, day, sortOrder),
    initialPageParam: 1,
    initialData: { pages: [{ articles: initialArticles, page: 1, pageSize: 12, total, totalPages }], pageParams: [1] },
    getNextPageParam: (lastPage) => lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    maxPages: 10,
  })
  const articles = query.data.pages.flatMap((page) => page.articles)
  const hasMore = Boolean(query.hasNextPage)

  useEffect(() => {
    const stateKey = `${BBS_SCROLL_STATE_PREFIX}${window.location.pathname}${window.location.search}`
    const savedState = sessionStorage.getItem(stateKey)
    if (!savedState) return

    let top = 0
    try {
      top = Math.max(0, JSON.parse(savedState).top)
    } catch {
      sessionStorage.removeItem(stateKey)
      return
    }
    if (!top) {
      sessionStorage.removeItem(stateKey)
      return
    }

    let attempts = 0
    let frame = 0
    const restore = () => {
      attempts += 1
      const main = document.querySelector<HTMLElement>('[data-bbs-scroll-container="main"]')
      const outer = document.querySelector<HTMLElement>('[data-bbs-scroll-container="outer"]')
      const container = main && main.scrollHeight > main.clientHeight + 1 ? main : outer
      if (!container) return
      container.scrollTop = top
      if (Math.abs(container.scrollTop - top) < 2 || container.scrollHeight >= top + container.clientHeight || attempts >= 180) {
        sessionStorage.removeItem(stateKey)
        return
      }
      frame = requestAnimationFrame(restore)
    }

    frame = requestAnimationFrame(restore)
    return () => cancelAnimationFrame(frame)
  }, [articles.length])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !query.isFetchingNextPage) void query.fetchNextPage()
    }, { rootMargin: '480px 0px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, query])

  return (
    <>
      <section aria-label="BBS 기사 목록" className="grid gap-4 md:grid-cols-2">
        {articles.map((article) => <BbsArticleCard key={article.id} article={article} listQuery={listParams} />)}
      </section>
      <div ref={sentinelRef} className="flex min-h-12 items-center justify-center pt-3 text-xs text-[var(--bbs-subtle-text)]" aria-live="polite">
        {query.isFetchingNextPage ? '기사를 불러오는 중입니다.' : hasMore ? '' : articles.length ? '모든 기사를 불러왔습니다.' : ''}
      </div>
    </>
  )
}
