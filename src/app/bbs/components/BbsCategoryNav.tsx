import Link from 'next/link'
import { AlertTriangle, BriefcaseBusiness, CalendarDays, LayoutGrid, Megaphone, PenLine } from 'lucide-react'
import { BBS_CATEGORIES, type BbsCategory } from '@/lib/bbs/articles'
import type { BbsDayKey } from '@/lib/bbs/days'
import type { BbsSortOrder } from '@/lib/bbs/data'

const categoryIcons = {
  전체: LayoutGrid,
  정보: Megaphone,
  사건사고: AlertTriangle,
  경제: BriefcaseBusiness,
  칼럼: PenLine,
  기타: CalendarDays,
} satisfies Record<BbsCategory, typeof LayoutGrid>

export default function BbsCategoryNav({ activeCategory, reporterIds = [], day, sortOrder = 'latest' }: { activeCategory: BbsCategory; reporterIds?: string[]; day?: BbsDayKey; sortOrder?: BbsSortOrder }) {
  return (
    <nav aria-label="BBS 기사 카테고리" className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-30 rounded-full border border-[var(--bbs-border)] bg-[var(--bbs-nav)] px-3 py-2 shadow-[0_4px_18px_rgba(0,0,0,0.12)] backdrop-blur md:inset-x-4 md:bottom-4 md:mx-auto md:max-w-6xl md:rounded-2xl md:border md:px-5 md:py-3 md:shadow-xl md:backdrop-blur-none">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-1 md:max-w-none md:justify-center md:gap-8">
        {BBS_CATEGORIES.map((category) => {
          const Icon = categoryIcons[category]
          const active = category === activeCategory
          const params = new URLSearchParams()
          if (category !== '전체') params.set('category', category)
          if (reporterIds.length) params.set('reporter', reporterIds.join(','))
          if (day) params.set('day', day)
          if (sortOrder === 'oldest') params.set('order', 'oldest')
          const query = params.toString()
          const href = `/bbs${query ? `?${query}` : ''}`

          return (
            <Link
              key={category}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors md:flex-row md:flex-none md:gap-1.5 md:px-2.5 md:text-xs ${active ? 'text-[var(--bbs-accent-strong)]' : 'text-[var(--bbs-subtle-text)] hover:bg-[var(--bbs-hover)] hover:text-[var(--bbs-text)]'}`}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
              <span className="truncate">{category}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
