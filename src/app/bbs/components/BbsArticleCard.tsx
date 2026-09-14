'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { BbsArticle } from '@/lib/bbs/articles'
import BongstagramDisplayName from '@/app/bongstagram/BongstagramDisplayName'
import BbsArticleVisual from './BbsArticleVisual'

export const BBS_SCROLL_STATE_PREFIX = 'bbs-scroll-state:'

function getScrollContainer() {
  const main = document.querySelector<HTMLElement>('[data-bbs-scroll-container="main"]')
  if (main && main.scrollHeight > main.clientHeight + 1) return main
  return document.querySelector<HTMLElement>('[data-bbs-scroll-container="outer"]')
}

function rememberBbsScrollPosition() {
  const container = getScrollContainer()
  if (!container) return
  sessionStorage.setItem(`${BBS_SCROLL_STATE_PREFIX}${window.location.pathname}${window.location.search}`, JSON.stringify({ top: container.scrollTop }))
}

function formatArticleTime(value: string) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (elapsedSeconds < 60) return '방금 전'
  if (elapsedSeconds < 60 * 60) return `${Math.floor(elapsedSeconds / 60)}분 전`
  if (elapsedSeconds < 24 * 60 * 60) return `${Math.floor(elapsedSeconds / (60 * 60))}시간 전`

  const parts = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' }).formatToParts(new Date(value))
  const month = parts.find((part) => part.type === 'month')?.value ?? ''
  const day = parts.find((part) => part.type === 'day')?.value ?? ''
  return `${month}월 ${day}일`
}

export default function BbsArticleCard({ article, listQuery = '' }: { article: BbsArticle; listQuery?: string }) {
  return (
    <Link href={`/bbs/article/${article.id}${listQuery ? `?${listQuery}` : ''}`} onClick={rememberBbsScrollPosition} className="group flex cursor-pointer overflow-hidden rounded-2xl border border-[var(--bbs-border)] bg-[var(--bbs-card)] shadow-[0_3px_12px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#e14b32]/30 hover:shadow-[0_8px_22px_rgba(0,0,0,0.1)] sm:block">
      <BbsArticleVisual article={article} compact />
      <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
        <div className="min-w-0 flex-1">
          <span className="mb-1.5 inline-flex rounded-full bg-[#e14b32]/10 px-2 py-0.5 text-[10px] font-semibold text-[#d7432d]">
            {article.category}
          </span>
          <h2 className="line-clamp-2 text-[13px] font-bold leading-snug text-[var(--bbs-text)] group-hover:text-[#d7432d] sm:text-[15px]">{article.title}</h2>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--bbs-subtle-text)]">
            <span><BongstagramDisplayName profileName={article.author} streamerName={article.authorStreamerName} /></span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.approvedAt} className="text-[#d7432d]">{formatArticleTime(article.approvedAt)}</time>
          </div>
        </div>
        <ChevronRight size={19} className="shrink-0 text-[#e14b32] transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
