import { createAdminClient } from '@/lib/supabase/admin'
import StreamerEditRow from './StreamerEditRow'
import { addStreamer } from './actions'
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
      <form action={addStreamer} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-xs font-semibold text-zinc-400 mb-3">스트리머 추가</p>
        <div className="flex flex-wrap gap-2">
          <input
            name="display_name"
            placeholder="표시 이름"
            required
            className="rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none placeholder:text-zinc-600"
          />
          <input
            name="chzzk_channel_id"
            placeholder="치지직 채널 ID"
            required
            className="rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none placeholder:text-zinc-600 w-72"
          />
          <input
            name="profile_image_url"
            placeholder="프로필 이미지 URL (선택)"
            className="rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none placeholder:text-zinc-600 w-64"
          />
          <button
            type="submit"
            className="rounded bg-amber-400 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-300 transition-colors cursor-pointer"
          >
            추가
          </button>
        </div>
      </form>

      {/* 목록 */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-900">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">이름</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">채널 ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 w-24">프로필 이미지</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 w-16">상태</th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {streamers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-600">
                  등록된 스트리머가 없습니다.
                </td>
              </tr>
            ) : (
              streamers.map((s) => <StreamerEditRow key={s.id} streamer={s} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
