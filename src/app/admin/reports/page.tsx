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

async function getReports(status: string, type: string, search: string, page: number, pageSize: number) {
  const supabase = createAdminClient()
  const safePageSize = [10, 20, 30, 40, 50].includes(pageSize) ? pageSize : 50
  let query = supabase
    .from('reports')
    .select('*', { count: 'exact' })

  if (status) query = query.eq('status', status)
  if (type) query = query.eq('type', type)
  const term = search.trim().replace(/[%_,()]/g, ' ')
  if (term) query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%,contact.ilike.%${term}%`)

  const safePage = Math.max(1, page)
  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range((safePage - 1) * safePageSize, safePage * safePageSize - 1)
  const total = count ?? 0
  return { reports: (data ?? []) as Report[], total, pageSize: safePageSize, totalPages: Math.max(1, Math.ceil(total / safePageSize)) }
}

function buildHref(status: string, type: string) {
  const params = new URLSearchParams()
  params.set('status', status || 'all')
  if (type) params.set('type', type)
  const qs = params.toString()
  return qs ? `/admin/reports?${qs}` : '/admin/reports'
}

type Props = { searchParams: Promise<{ status?: string; type?: string; search?: string; page?: string; pageSize?: string }> }

export default async function AdminReportsPage({ searchParams }: Props) {
  const params = await searchParams
  const status = params.status === undefined ? 'pending' : params.status === 'all' ? '' : params.status
  const type = params.type ?? ''
  const search = params.search ?? ''
  const page = Number.parseInt(params.page ?? '', 10) || 1
  const pageSize = Number.parseInt(params.pageSize ?? '', 10) || 50
  const data = await getReports(status, type, search, page, pageSize)
  const currentPage = Math.min(page, data.totalPages)

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-white">제보 관리</h1>
            <p className="mt-0.5 text-sm text-zinc-500">총 {data.total}건 · {currentPage}/{data.totalPages}페이지</p>
          </div>
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

      <AdminReportsClient reports={data.reports} total={data.total} totalPages={data.totalPages} currentPage={currentPage} pageSize={data.pageSize} search={search} />
    </div>
  )
}
