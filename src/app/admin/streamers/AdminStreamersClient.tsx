'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import StreamerEditRow from './StreamerEditRow'

type Streamer = {
  id: string
  chzzk_channel_id: string
  display_name: string
  profile_image_url: string | null
  is_active: boolean
  created_at: string
}

export default function AdminStreamersClient({ streamers }: { streamers: Streamer[] }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return streamers
    return streamers.filter(
      (s) => s.display_name.toLowerCase().includes(q) || s.chzzk_channel_id.toLowerCase().includes(q)
    )
  }, [streamers, search])

  return (
    <div className="space-y-4">
      {/* 검색 */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 채널 ID 검색"
            className="rounded border border-zinc-700 bg-zinc-900 py-2 pl-7 pr-7 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X size={12} />
            </button>
          )}
        </div>
        <span className="text-xs text-zinc-600">
          {search ? `${filtered.length} / ${streamers.length}명` : `${streamers.length}명`}
        </span>
      </div>

      {/* 목록 */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: '9rem' }} />
            <col style={{ width: '18rem' }} />
            <col />
            <col style={{ width: '4rem' }} />
            <col style={{ width: '11rem' }} />
          </colgroup>
          <thead>
            <tr className="bg-zinc-900">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">이름</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">채널 ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">프로필 이미지 URL</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">상태</th>
              <th className="px-4 py-3" style={{ width: '11rem' }} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-600">
                  {search ? '검색 결과가 없습니다.' : '등록된 스트리머가 없습니다.'}
                </td>
              </tr>
            ) : (
              filtered.map((s) => <StreamerEditRow key={s.id} streamer={s} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
