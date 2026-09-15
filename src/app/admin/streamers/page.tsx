import { createAdminClient } from '@/lib/supabase/admin'
import AdminStreamersClient from './AdminStreamersClient'
import StreamerAddForm from './StreamerAddForm'
import type { Metadata } from 'next'
import CacheRefreshButton from '@/components/admin/CacheRefreshButton'

export const metadata: Metadata = { title: '스트리머 관리' }

async function getStreamers(page: number, pageSize: number, search: string) {
  const supabase = createAdminClient()
  const safePageSize = [10, 20, 30, 40, 50].includes(pageSize) ? pageSize : 50
  let query = supabase
    .from('streamers')
    .select('id, chzzk_channel_id, display_name, profile_image_url, is_active, created_at', { count: 'exact' })
  if (search.trim()) query = query.ilike('display_name', `%${search.trim().replace(/[%_]/g, ' ')}%`)
  const { data, count } = await query
    .order('display_name')
    .range((Math.max(1, page) - 1) * safePageSize, Math.max(1, page) * safePageSize - 1)
  return { streamers: (data ?? []) as {
    id: string
    chzzk_channel_id: string
    display_name: string
    profile_image_url: string | null
    is_active: boolean
    created_at: string
  }[], total: count ?? 0, pageSize: safePageSize, totalPages: Math.max(1, Math.ceil((count ?? 0) / safePageSize)) }
}

export default async function AdminStreamersPage({ searchParams }: { searchParams: Promise<{ page?: string; pageSize?: string; search?: string }> }) {
  const params = await searchParams
  const page = Number.parseInt(params.page ?? '', 10) || 1
  const pageSize = Number.parseInt(params.pageSize ?? '', 10) || 50
  const search = params.search ?? ''
  const data = await getStreamers(page, pageSize, search)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white">스트리머 관리</h1>
          <p className="text-sm text-zinc-500 mt-0.5">총 {data.total}명 · {page}/{data.totalPages}페이지</p>
        </div>
        <CacheRefreshButton scope="streamers" />
      </div>

      {/* 추가 폼 */}
      <StreamerAddForm />

      <AdminStreamersClient streamers={data.streamers} total={data.total} totalPages={data.totalPages} currentPage={Math.min(page, data.totalPages)} pageSize={data.pageSize} search={search} />
    </div>
  )
}
