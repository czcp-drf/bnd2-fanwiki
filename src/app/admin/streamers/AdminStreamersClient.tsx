'use client'

import { useState, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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

export default function AdminStreamersClient({ streamers, total, totalPages, currentPage, pageSize: initialPageSize }: { streamers: Streamer[]; total: number; totalPages: number; currentPage: number; pageSize: number; search: string }) {
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(String(initialPageSize))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return streamers
    return streamers.filter(
      (s) => s.display_name.toLowerCase().includes(q) || s.chzzk_channel_id.toLowerCase().includes(q)
    )
  }, [streamers, search])

  function movePage(page: number) { const params = new URLSearchParams(searchParams.toString()); params.set('page', String(page)); router.push(`${pathname}?${params.toString()}`, { scroll: false }) }
  function changePageSize(value: string) { setPageSize(value); const params = new URLSearchParams(searchParams.toString()); params.set('pageSize', value); params.delete('page'); router.push(`${pathname}?${params.toString()}`, { scroll: false }) }

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
          {filtered.length} / {total}명
        </span>
        <select value={pageSize} onChange={(e) => changePageSize(e.target.value)} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-2 text-xs text-zinc-300"><option value="10">10개씩</option><option value="20">20개씩</option><option value="30">30개씩</option><option value="40">40개씩</option><option value="50">50개씩</option></select>
      </div>
      {totalPages > 1 && <nav className="flex items-center justify-center gap-2 pt-2" aria-label="스트리머 페이지 이동"><button type="button" onClick={() => movePage(currentPage - 1)} disabled={currentPage <= 1} className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 disabled:opacity-40">이전</button><span className="text-xs text-zinc-500">{currentPage} / {totalPages}</span><button type="button" onClick={() => movePage(currentPage + 1)} disabled={currentPage >= totalPages} className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 disabled:opacity-40">다음</button></nav>}

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
