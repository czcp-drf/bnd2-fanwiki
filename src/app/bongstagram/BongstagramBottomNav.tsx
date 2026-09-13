'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, SquarePlus, UserRound } from 'lucide-react'

function FilledHomeIcon({ size = 23 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.3 10.3 12 2.5l9.7 7.8v10.2h-6.2v-6.4H8.5v6.4H2.3V10.3Z" />
    </svg>
  )
}

export default function BongstagramBottomNav() {
  const pathname = usePathname()
  const homeActive = pathname === '/bongstagram'
  const searchActive = pathname === '/bongstagram/search'
  const profileActive = pathname === '/bongstagram/me' || pathname === '/bongstagram/profiles' || (pathname.startsWith('/bongstagram/') && !searchActive)
  const activeClass = 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'
  const inactiveClass = 'text-zinc-500 hover:text-zinc-200'

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-[540px] items-center justify-around border-x border-t border-zinc-800 bg-zinc-950/95 px-3 py-3 backdrop-blur" aria-label="Bongstagram 메뉴">
      <Link href="/bongstagram" aria-label="홈" aria-current={homeActive ? 'page' : undefined} className={`transition-all ${homeActive ? activeClass : inactiveClass}`}>
        <FilledHomeIcon />
      </Link>
      <Link href="/bongstagram/search" aria-label="검색" aria-current={searchActive ? 'page' : undefined} className={`transition-all ${searchActive ? activeClass : inactiveClass}`}>
        <Search size={23} />
      </Link>
      <button type="button" aria-label="게시물 작성" aria-disabled="true" disabled title="게시물 작성은 관리자 화면에서만 가능합니다." className="cursor-not-allowed text-zinc-700">
        <SquarePlus size={24} strokeWidth={1.8} />
      </button>
      <Link href="/bongstagram/me" aria-label="내 프로필" aria-current={profileActive ? 'page' : undefined} className={`transition-all ${profileActive ? activeClass : inactiveClass}`}>
        <UserRound size={22} strokeWidth={2.2} />
      </Link>
    </nav>
  )
}
