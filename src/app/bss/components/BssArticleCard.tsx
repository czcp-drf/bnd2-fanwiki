import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { BssArticle } from '@/lib/bss/articles'
import BssArticleVisual from './BssArticleVisual'

function formatArticleTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: false }).format(new Date(value))
}

export default function BssArticleCard({ article }: { article: BssArticle }) {
  return (
    <Link href={`/bss/article/${article.id}`} className="group block cursor-pointer overflow-hidden rounded-2xl border border-[var(--bss-border)] bg-[var(--bss-card)] shadow-[0_3px_12px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#e14b32]/30 hover:shadow-[0_8px_22px_rgba(0,0,0,0.1)]">
      <BssArticleVisual article={article} />
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-sm font-bold leading-snug text-[var(--bss-text)] group-hover:text-[#d7432d] sm:text-[15px]">{article.title}</h2>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--bss-subtle-text)]">
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
