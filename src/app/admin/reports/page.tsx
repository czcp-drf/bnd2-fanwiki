import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import AdminReportsClient from './AdminReportsClient'
import type { Report } from '@/types/database'
import CacheRefreshButton from '@/components/admin/CacheRefreshButton'

const statusOptions = [
  { value: '', label: '전체' },
  { value: 'pending', label: '대기중' },
  { value: 'reviewing', label: '검토중' },
  { value: 'applied', label: '반영됨' },
  { value: 'rejected', label: '반려됨' },
]

const typeOptions = [
  { value: '', label: '전체' },
  { value: 'new_character', label: '새 캐릭터' },
  { value: 'new_event', label: '새 사건' },
  { value: 'correction', label: '수정 요청' },
  { value: 'other', label: '기타' },
]

async function getReports(status: string, type: string) {
  const supabase = createAdminClient()
  let query = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (type) query = query.eq('type', type)

  const { data } = await query
  return (data ?? []) as Report[]
}

function buildHref(status: string, type: string) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (type) params.set('type', type)
  const qs = params.toString()
  return qs ? `/admin/reports?${qs}` : '/admin/reports'
}

type Props = { searchParams: Promise<{ status?: string; type?: string }> }

export default async function AdminReportsPage({ searchParams }: Props) {
  const { status = '', type = '' } = await searchParams
  const reports = await getReports(status, type)

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-black text-white">제보 관리</h1>
          <CacheRefreshButton scope="reports" />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium text-zinc-500 w-8 shrink-0">상태</span>
          <div className="flex items-center gap-2 flex-wrap">
            {statusOptions.map((opt) => (
              <Link
                key={opt.value}
                href={buildHref(opt.value, type)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  status === opt.value
                    ? 'border-amber-400/50 bg-amber-400/10 text-amber-400'
                    : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium text-zinc-500 w-8 shrink-0">유형</span>
          <div className="flex items-center gap-2 flex-wrap">
            {typeOptions.map((opt) => (
              <Link
                key={opt.value}
                href={buildHref(status, opt.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  type === opt.value
                    ? 'border-amber-400/50 bg-amber-400/10 text-amber-400'
                    : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <AdminReportsClient reports={reports} />
    </div>
  )
}
