'use client'

import { useEffect, useRef, useState } from 'react'
import type { BbsArticle } from '@/lib/bbs/articles'
import type { BbsDayKey } from '@/lib/bbs/days'
import type { BbsSortOrder } from '@/lib/bbs/data'
import { getBbsArticlesPageAction } from '../actions'
import BbsArticleCard from './BbsArticleCard'

export default function BbsArticleInfiniteList({ initialArticles, total, category, reporterIds, day, sortOrder }: { initialArticles: BbsArticle[]; total: number; category: string; reporterIds: string[]; day?: BbsDayKey; sortOrder: BbsSortOrder }) {
  const [articles, setArticles] = useState(initialArticles)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const hasMore = articles.length < total
  const listParams = new URLSearchParams()
  if (category !== '전체') listParams.set('category', category)
  if (reporterIds.length) listParams.set('reporter', reporterIds.join(','))
  if (day) listParams.set('day', day)
  if (sortOrder === 'oldest') listParams.set('order', 'oldest')
  const listQuery = listParams.toString()
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting || loading) return
      setLoading(true)
      void getBbsArticlesPageAction(category === '전체' ? undefined : category, reporterIds, page + 1, day, sortOrder)
        .then((result) => {
          setArticles((current) => [...current, ...result.articles])
          setPage(result.page)
        })
        .finally(() => setLoading(false))
    }, { rootMargin: '480px 0px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [category, day, hasMore, loading, page, reporterIds, sortOrder])

  return (
    <>
      <section aria-label="BBS 기사 목록" className="grid gap-4 md:grid-cols-2">
        {articles.map((article) => <BbsArticleCard key={article.id} article={article} listQuery={listQuery} />)}
      </section>
      <div ref={sentinelRef} className="flex min-h-12 items-center justify-center pt-3 text-xs text-[var(--bbs-subtle-text)]" aria-live="polite">
        {loading ? '기사를 불러오는 중입니다.' : hasMore ? '' : articles.length ? '모든 기사를 불러왔습니다.' : ''}
      </div>
    </>
  )
}
