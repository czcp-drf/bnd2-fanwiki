import { createAdminClient } from '@/lib/supabase/admin'
import { unblockIp } from '../reports/actions'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'IP 차단 관리' }

async function getBlockedIps(page: number, pageSize: number) {
  const supabase = createAdminClient()
  const safePageSize = [10, 20, 30, 40, 50].includes(pageSize) ? pageSize : 50
  const { data, count } = await supabase
    .from('blocked_ips')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((Math.max(1, page) - 1) * safePageSize, Math.max(1, page) * safePageSize - 1)
  return { blockedIps: (data ?? []) as { id: string; ip_hash: string | null; reason: string | null; created_at: string }[], total: count ?? 0, pageSize: safePageSize, totalPages: Math.max(1, Math.ceil((count ?? 0) / safePageSize)) }
}

export default async function BlockedIpsPage({ searchParams }: { searchParams: Promise<{ page?: string; pageSize?: string }> }) {
  const params = await searchParams
  const page = Number.parseInt(params.page ?? '', 10) || 1
  const pageSize = Number.parseInt(params.pageSize ?? '', 10) || 50
  const data = await getBlockedIps(page, pageSize)
  const currentPage = Math.min(page, data.totalPages)
  const href = (nextPage: number, nextPageSize = data.pageSize) => `/admin/blocked-ips?page=${nextPage}&pageSize=${nextPageSize}`

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-black text-white">IP 차단 관리</h1>
        <p className="text-sm text-zinc-500 mt-0.5">총 {data.total}개 · {currentPage}/{data.totalPages}페이지</p>
      </div>

      {data.total === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-20 text-center text-sm text-zinc-600">
          차단된 IP가 없습니다.
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900 text-left text-xs text-zinc-500">
                <th className="px-4 py-3">IP 식별자</th>
                <th className="px-4 py-3">차단 일시</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {data.blockedIps.map((b) => (
                <tr key={b.id} className="bg-zinc-950">
                  <td className="px-4 py-3 font-mono text-zinc-300" title={b.ip_hash ?? undefined}>
                    {b.ip_hash ? `${b.ip_hash.slice(0, 16)}…` : '이전 IP 데이터 · 백필 필요'}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(b.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <form action={unblockIp.bind(null, b.id)}>
                      <button
                        type="submit"
                        className="rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                      >
                        차단 해제
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data.total > 0 && <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="차단 IP 페이지 이동"><span className="mr-1 text-xs text-zinc-500">페이지당</span>{[10, 20, 30, 40, 50].map((size) => <Link key={size} href={href(1, size)} className={`rounded border px-2 py-1.5 text-xs ${data.pageSize === size ? 'border-amber-400/50 bg-amber-400/10 text-amber-400' : 'border-zinc-700 text-zinc-500'}`}>{size}</Link>)}<Link href={href(Math.max(1, currentPage - 1))} aria-disabled={currentPage <= 1} className={`ml-2 rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 ${currentPage <= 1 ? 'pointer-events-none opacity-40' : ''}`}>이전</Link><span className="text-xs text-zinc-500">{currentPage} / {data.totalPages}</span><Link href={href(Math.min(data.totalPages, currentPage + 1))} aria-disabled={currentPage >= data.totalPages} className={`rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 ${currentPage >= data.totalPages ? 'pointer-events-none opacity-40' : ''}`}>다음</Link></nav>}
    </div>
  )
}
