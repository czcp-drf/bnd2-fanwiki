import Link from 'next/link'
import { AlertTriangle, BriefcaseBusiness, FileText, FolderOpen, LayoutGrid, PenLine } from 'lucide-react'
import { BSS_CATEGORIES, type BssCategory } from '@/lib/bss/articles'

const categoryIcons = {
  전체: LayoutGrid,
  정보: FileText,
  사건사고: AlertTriangle,
  경제: BriefcaseBusiness,
  칼럼: PenLine,
  기타: FolderOpen,
} satisfies Record<BssCategory, typeof LayoutGrid>

export default function BssCategoryNav({ activeCategory }: { activeCategory: BssCategory }) {
  return (
    <nav aria-label="BSS 기사 카테고리" className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--bss-border)] bg-[var(--bss-nav)] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_18px_rgba(0,0,0,0.08)] backdrop-blur md:static md:mx-auto md:max-w-6xl md:border md:px-5 md:py-3 md:shadow-sm md:backdrop-blur-none">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-1 md:max-w-none md:justify-center md:gap-8">
        {BSS_CATEGORIES.map((category) => {
          const Icon = categoryIcons[category]
          const active = category === activeCategory
          const href = category === '전체' ? '/bss' : `/bss?category=${encodeURIComponent(category)}`

          return (
            <Link
              key={category}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors md:flex-row md:flex-none md:gap-1.5 md:px-2.5 md:text-xs ${active ? 'text-[#e14b32]' : 'text-[var(--bss-subtle-text)] hover:bg-[var(--bss-hover)] hover:text-[var(--bss-text)]'}`}
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
