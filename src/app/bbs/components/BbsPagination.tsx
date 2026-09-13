import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { BbsCategory } from '@/lib/bbs/articles'

function getVisiblePages(currentPage: number, totalPages: number) {
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function getPageHref(page: number, category: BbsCategory, reporterIds: string[]) {
  const params = new URLSearchParams()
  if (category !== '전체') params.set('category', category)
  if (reporterIds.length) params.set('reporter', reporterIds.join(','))
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return `/bbs${query ? `?${query}` : ''}`
}

export default function BbsPagination({ currentPage, totalPages, category, reporterIds }: { currentPage: number; totalPages: number; category: BbsCategory; reporterIds: string[] }) {
  if (totalPages <= 1) return null

  const pages = getVisiblePages(currentPage, totalPages)
  return (
    <nav aria-label="BBS 기사 페이지" className="flex items-center justify-center gap-1 pt-3">
      <Link
        href={getPageHref(Math.max(1, currentPage - 1), category, reporterIds)}
        aria-label="이전 페이지"
        aria-disabled={currentPage <= 1}
        className={`flex h-9 w-9 items-center justify-center rounded-full border border-[var(--bbs-border)] transition-colors ${currentPage <= 1 ? 'pointer-events-none opacity-35' : 'cursor-pointer text-[var(--bbs-subtle-text)] hover:bg-[var(--bbs-hover)] hover:text-[var(--bbs-text)]'}`}
      >
        <ChevronLeft size={16} />
      </Link>
      {pages.map((page) => (
        <Link
          key={page}
          href={getPageHref(page, category, reporterIds)}
          aria-current={page === currentPage ? 'page' : undefined}
          className={`flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-full px-2 text-xs font-semibold transition-colors ${page === currentPage ? 'bg-[#e14b32] text-white' : 'text-[var(--bbs-subtle-text)] hover:bg-[var(--bbs-hover)] hover:text-[var(--bbs-text)]'}`}
        >
          {page}
        </Link>
      ))}
      <Link
        href={getPageHref(Math.min(totalPages, currentPage + 1), category, reporterIds)}
        aria-label="다음 페이지"
        aria-disabled={currentPage >= totalPages}
        className={`flex h-9 w-9 items-center justify-center rounded-full border border-[var(--bbs-border)] transition-colors ${currentPage >= totalPages ? 'pointer-events-none opacity-35' : 'cursor-pointer text-[var(--bbs-subtle-text)] hover:bg-[var(--bbs-hover)] hover:text-[var(--bbs-text)]'}`}
      >
        <ChevronRight size={16} />
      </Link>
    </nav>
  )
}
