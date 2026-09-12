import { createAdminClient } from '@/lib/supabase/admin'
import AdminStreamersClient from './AdminStreamersClient'
import StreamerAddForm from './StreamerAddForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '스트리머 관리' }

async function getStreamers() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('streamers')
    .select('id, chzzk_channel_id, display_name, profile_image_url, is_active, created_at')
    .order('display_name')
  return (data ?? []) as {
    id: string
    chzzk_channel_id: string
    display_name: string
    profile_image_url: string | null
    is_active: boolean
    created_at: string
  }[]
}

export default async function AdminStreamersPage() {
  const streamers = await getStreamers()

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-black text-white">스트리머 관리</h1>
        <p className="text-sm text-zinc-500 mt-0.5">총 {streamers.length}명</p>
      </div>

      {/* 추가 폼 */}
      <StreamerAddForm />

      <AdminStreamersClient streamers={streamers} />
    </div>
  )
}
