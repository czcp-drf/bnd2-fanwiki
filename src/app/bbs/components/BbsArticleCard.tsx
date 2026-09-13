import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { BbsArticle } from '@/lib/bbs/articles'
import BbsArticleVisual from './BbsArticleVisual'

function formatArticleTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: false }).format(new Date(value))
}

export default function BbsArticleCard({ article }: { article: BbsArticle }) {
  return (
    <Link href={`/bbs/article/${article.id}`} className="group block cursor-pointer overflow-hidden rounded-2xl border border-[var(--bbs-border)] bg-[var(--bbs-card)] shadow-[0_3px_12px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#e14b32]/30 hover:shadow-[0_8px_22px_rgba(0,0,0,0.1)]">
      <BbsArticleVisual article={article} />
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-sm font-bold leading-snug text-[var(--bbs-text)] group-hover:text-[#d7432d] sm:text-[15px]">{article.title}</h2>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--bbs-subtle-text)]">
            <span>{article.author}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.approvedAt}>{formatArticleTime(article.approvedAt)}</time>
          </div>
        </div>
        <ChevronRight size={19} className="shrink-0 text-[#e14b32] transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
