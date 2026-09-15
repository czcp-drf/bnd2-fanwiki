import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import AdminEventsClient from './AdminEventsClient'
import CacheRefreshButton from '@/components/admin/CacheRefreshButton'

const EVENT_TYPES = ['war', 'crime', 'political', 'social', 'accident', 'highlight', 'other'] as const

async function getEvents(page: number, pageSize: number, search: string, type: string) {
  const supabase = createAdminClient()
  const safePageSize = [10, 20, 30, 40, 50].includes(pageSize) ? pageSize : 50
  let query = supabase.from('events').select('id, title, type, occurred_at, is_published, created_at', { count: 'exact' })
  if (search.trim()) query = query.ilike('title', `%${search.trim().replace(/[%_]/g, ' ')}%`)
  if (EVENT_TYPES.includes(type as typeof EVENT_TYPES[number])) query = query.eq('type', type)
  const { data, count } = await query
    .order('occurred_at', { ascending: false, nullsFirst: false })
    .range((Math.max(1, page) - 1) * safePageSize, Math.max(1, page) * safePageSize - 1)
  return { events: data ?? [], total: count ?? 0, pageSize: safePageSize, totalPages: Math.max(1, Math.ceil((count ?? 0) / safePageSize)) }
}

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ page?: string; pageSize?: string; search?: string; type?: string }> }) {
  const params = await searchParams
  const page = Number.parseInt(params.page ?? '', 10) || 1
  const pageSize = Number.parseInt(params.pageSize ?? '', 10) || 50
  const search = params.search ?? ''
  const type = params.type ?? ''
  const data = await getEvents(page, pageSize, search, type)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">사건 관리</h1>
          <p className="text-sm text-zinc-500 mt-0.5">총 {data.total}건 · {page}/{data.totalPages}페이지</p>
        </div>
        <div className="flex items-center gap-2">
          <CacheRefreshButton scope="events" />
          <Link
            href="/admin/events/new"
            className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-zinc-900 hover:bg-amber-300 transition-colors"
          >
            <Plus size={13} />
            새 사건 작성
          </Link>
        </div>
      </div>

      <AdminEventsClient events={data.events} total={data.total} totalPages={data.totalPages} currentPage={Math.min(page, data.totalPages)} pageSize={data.pageSize} search={search} type={type} />
    </div>
  )
}
