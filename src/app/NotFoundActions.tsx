'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const PATH_ACTIONS: { match: RegExp; label: string; href: string }[] = [
  { match: /^\/characters/, label: '캐릭터 목록', href: '/characters' },
  { match: /^\/organizations/, label: '조직 목록', href: '/organizations' },
  { match: /^\/events/, label: '사건 아카이브', href: '/events' },
  { match: /^\/streamers/, label: '스트리머 목록', href: '/streamers' },
  { match: /^\/map/, label: '거점 지도', href: '/map' },
  { match: /^\/search/, label: '검색', href: '/search' },
  { match: /^\/bss/, label: 'BSS', href: '/bss' },
  { match: /^\/admin/, label: '어드민 대시보드', href: '/admin' },
]

export default function NotFoundActions() {
  const pathname = usePathname()
  const matched = PATH_ACTIONS.find((a) => a.match.test(pathname))

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <Link
        href="/"
        className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-bold text-zinc-900 hover:bg-amber-300 transition-colors"
      >
        홈으로
      </Link>
      <Link
        href={matched?.href ?? '/characters'}
        className="rounded-lg border border-zinc-700 bg-zinc-800 px-5 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
      >
        {matched?.label ?? '캐릭터 목록'}
      </Link>
    </div>
  )
}
