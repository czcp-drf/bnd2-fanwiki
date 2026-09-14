'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Search, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useRedPill } from '@/lib/context/RedPillContext'
import { BongstagramThemeToggle } from '@/components/bongstagram/BongstagramTheme'

const navItems = [
  { href: '/', label: '홈' },
  { href: '/schedule', label: '일정' },
  { href: '/streamers', label: '스트리머' },
  { href: '/characters', label: '캐릭터' },
  { href: '/organizations', label: '조직' },
  { href: '/bbs', label: 'BBS' },
  { href: '/map', label: '지도' },
  { href: '/events', label: '사건' },
  { href: '/report', label: '제보' },
]

function NavLink({
  href,
  label,
  pathname,
  onClick,
}: {
  href: string
  label: string
  pathname: string
  onClick?: () => void
}) {
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'relative text-sm font-medium transition-colors duration-150',
        'after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-0 after:bg-amber-400 after:transition-all after:duration-200',
        isActive
          ? 'text-amber-400 after:w-full'
          : 'text-zinc-400 hover:text-zinc-100 hover:after:w-full'
      )}
    >
      {label}
    </Link>
  )
}

function RedPillToggle({ compact = false }: { compact?: boolean }) {
  const { isRedPill, toggle } = useRedPill()

  return (
    <button
      onClick={toggle}
      title={isRedPill ? '빨간약 ON — 클릭하면 끕니다' : '빨간약 OFF — 클릭하면 켭니다'}
      className={cn(
        'flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all duration-200',
        isRedPill
          ? 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20'
          : 'border-zinc-700 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
      )}
    >
      <span className={cn(
        'h-2 w-2 rounded-full transition-colors',
        isRedPill ? 'bg-red-400' : 'bg-zinc-600'
      )} />
      {!compact && (
        <span>{isRedPill ? '빨간약' : '파란약'}</span>
      )}
    </button>
  )
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    if (!searchOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery('') }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [searchOpen])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    setSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <header className="sticky top-0 z-50 h-14 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-lg font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
            봉누도 따라가기
          </span>
        </Link>

        {/* 데스크탑 네비게이션 */}
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </nav>

        {/* 우측: 검색 + 빨간약 토글 + 모바일 메뉴 */}
        <div className="flex items-center gap-2">
          {/* 검색 */}
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-1">
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="캐릭터, 조직, 사건 검색"
                className="w-40 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none sm:w-56"
              />
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                className="cursor-pointer p-1 text-zinc-500 transition-colors hover:text-zinc-200"
              >
                <X size={15} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="cursor-pointer p-1.5 text-zinc-400 transition-colors hover:text-zinc-100"
              aria-label="검색"
            >
              <Search size={17} />
            </button>
          )}

          <RedPillToggle />
          <BongstagramThemeToggle />

          {/* 모바일 메뉴 */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="flex items-center justify-center rounded-md p-2 text-zinc-400 hover:text-zinc-100 md:hidden"
              aria-label="메뉴 열기"
            >
              <Menu size={20} />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-64 border-zinc-800 bg-zinc-950 px-0"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
                <span className="text-base font-black text-white">봉누도 따라가기</span>
              </div>
              <nav className="flex flex-col gap-1 p-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href))
                        ? 'bg-amber-400/10 text-amber-400'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
