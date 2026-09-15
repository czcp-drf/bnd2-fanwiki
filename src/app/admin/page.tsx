import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Users, FileText, Building2, AlertCircle } from 'lucide-react'

async function getStats() {
  const supabase = createAdminClient()
  const [
    { count: streamerCount },
    { count: characterCount },
    { count: unnamedCount },
    { count: pendingReports },
    { count: orgCount },
  ] = await Promise.all([
    supabase.from('streamers').select('*', { count: 'exact', head: true }),
    supabase.from('characters').select('*', { count: 'exact', head: true }),
    supabase.from('characters').select('*', { count: 'exact', head: true }).eq('name', '미정'),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])
  return { streamerCount, characterCount, unnamedCount, pendingReports, orgCount }
}

export default async function AdminPage() {
  const stats = await getStats()

  const cards = [
    { label: '전체 스트리머', value: stats.streamerCount, icon: Users, href: null, color: 'text-blue-400' },
    { label: '전체 캐릭터', value: stats.characterCount, icon: Users, href: '/admin/characters', color: 'text-emerald-400' },
    { label: '미정 캐릭터', value: stats.unnamedCount, icon: AlertCircle, href: '/admin/characters?filter=unnamed', color: 'text-amber-400' },
    { label: '미처리 제보', value: stats.pendingReports, icon: FileText, href: '/admin/reports', color: 'text-red-400' },
    { label: '활동 조직', value: stats.orgCount, icon: Building2, href: null, color: 'text-purple-400' },
  ]

  return (
    <div className="space-y-6 p-4 sm:p-6 md:space-y-8 md:p-8">
      <div>
        <h1 className="text-lg font-black text-white sm:text-xl">대시보드</h1>
        <p className="text-sm text-zinc-500 mt-0.5">봉누도 따라가기 관리 현황</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, href, color }) => {
          const content = (
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700 sm:p-5">
              <div>
                <p className="text-[11px] text-zinc-500 sm:text-xs">{label}</p>
                <p className="mt-1 text-xl font-black text-white sm:text-2xl">{value ?? 0}</p>
              </div>
              <Icon size={20} className={color} />
            </div>
          )
          return href ? (
            <Link key={label} href={href}>{content}</Link>
          ) : (
            <div key={label}>{content}</div>
          )
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Link href="/admin/characters?filter=unnamed" className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 transition-colors hover:bg-amber-400/10 sm:p-5">
          <p className="text-sm font-bold text-amber-400">RP명 미정 캐릭터 수정 →</p>
          <p className="text-xs text-zinc-500 mt-1">아직 이름이 정해지지 않은 캐릭터 {stats.unnamedCount ?? 0}명을 업데이트하세요.</p>
        </Link>
        <Link href="/admin/reports" className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700 sm:p-5">
          <p className="text-sm font-bold text-white">제보 확인 →</p>
          <p className="text-xs text-zinc-500 mt-1">미처리 제보 {stats.pendingReports ?? 0}건이 있습니다.</p>
        </Link>
      </div>
    </div>
  )
}
