import Link from 'next/link'
import { Bell, Filter } from 'lucide-react'
import BbsLogo from './BbsLogo'

export default function BbsHeader() {
  return (
    <header className="border-b border-[var(--bbs-border)] bg-[var(--bbs-surface)] px-5 py-5 sm:px-7 md:rounded-t-3xl md:px-8 md:py-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/bbs" aria-label="BBS 홈" className="cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e14b32]/50">
          <BbsLogo />
        </Link>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="기사 필터" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[var(--bbs-muted)] text-[var(--bbs-subtle-text)] transition-colors hover:bg-[var(--bbs-border)] hover:text-[var(--bbs-text)]">
            <Filter size={17} />
          </button>
          <button type="button" aria-label="알림" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[var(--bbs-muted)] text-[var(--bbs-subtle-text)] transition-colors hover:bg-[var(--bbs-border)] hover:text-[var(--bbs-text)]">
            <Bell size={17} />
          </button>
        </div>
      </div>
    </header>
  )
}
