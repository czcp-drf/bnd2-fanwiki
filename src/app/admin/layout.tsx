import Link from 'next/link'
import { logout } from './login/actions'
import { LayoutDashboard, FileText, Users, Building2, LogOut, Swords, GitFork, ShieldOff, Tv2, Map, Camera, Images } from 'lucide-react'

const navItems = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/characters', label: '캐릭터 관리', icon: Users },
  { href: '/admin/organizations', label: '조직 관리', icon: Building2 },
  { href: '/admin/events', label: '사건 관리', icon: Swords },
  { href: '/admin/relationships', label: '관계 관리', icon: GitFork },
  { href: '/admin/streamers', label: '스트리머 관리', icon: Tv2 },
  { href: '/admin/bongstagram', label: 'Bongstagram 프로필', icon: Camera },
  { href: '/admin/bongstagram/posts', label: 'Bongstagram 게시물', icon: Images },
  { href: '/admin/map', label: '거점 지도', icon: Map },
  { href: '/admin/reports', label: '제보 관리', icon: FileText },
  { href: '/admin/blocked-ips', label: 'IP 차단', icon: ShieldOff },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* 사이드바 */}
      <aside className="hidden w-52 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 md:flex">
        <div className="border-b border-zinc-800 px-5 py-4">
          <Link href="/" className="text-sm font-black text-white">
            봉누도<span className="text-amber-400">2</span>
            <span className="ml-1.5 text-xs font-medium text-zinc-500">관리자</span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-zinc-800 p-3">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            >
              <LogOut size={15} />
              로그아웃
            </button>
          </form>
        </div>
      </aside>

      {/* 콘텐츠 */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
