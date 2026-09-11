import { createAdminClient } from '@/lib/supabase/admin'
import { unblockIp } from '../reports/actions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'IP 차단 관리' }

async function getBlockedIps() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('blocked_ips')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as { id: string; ip: string; reason: string | null; created_at: string }[]
}

export default async function BlockedIpsPage() {
  const blockedIps = await getBlockedIps()

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-black text-white">IP 차단 관리</h1>
        <p className="text-sm text-zinc-500 mt-0.5">총 {blockedIps.length}개</p>
      </div>

      {blockedIps.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-20 text-center text-sm text-zinc-600">
          차단된 IP가 없습니다.
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900 text-left text-xs text-zinc-500">
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">차단 일시</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {blockedIps.map((b) => (
                <tr key={b.id} className="bg-zinc-950">
                  <td className="px-4 py-3 font-mono text-zinc-300">{b.ip}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(b.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <form action={unblockIp.bind(null, b.ip)}>
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
    </div>
  )
}
