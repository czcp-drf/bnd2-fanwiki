import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import AdminEventsClient from './AdminEventsClient'
import CacheRefreshButton from '@/components/admin/CacheRefreshButton'

async function getEvents() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('events')
    .select('id, title, type, occurred_at, is_published, created_at')
    .order('occurred_at', { ascending: false, nullsFirst: false })
  return data ?? []
}

export default async function AdminEventsPage() {
  const events = await getEvents()

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">사건 관리</h1>
          <p className="text-sm text-zinc-500 mt-0.5">총 {events.length}건</p>
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

      <AdminEventsClient events={events} />
    </div>
  )
}
