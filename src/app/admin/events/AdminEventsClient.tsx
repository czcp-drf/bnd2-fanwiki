'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, X, Pencil } from 'lucide-react'
import EventDeleteButton from './EventDeleteButton'
import TogglePublishButton from './TogglePublishButton'
import { formatKstDateTime } from '@/lib/date/kst'

const typeLabel: Record<string, string> = {
  war: '전쟁/항쟁', crime: '범죄', political: '정치',
  social: '사회', accident: '사고', highlight: '하이라이트', other: '기타',
}

const typeOptions = [
  { value: 'war', label: '전쟁/항쟁' },
  { value: 'crime', label: '범죄' },
  { value: 'political', label: '정치' },
  { value: 'social', label: '사회' },
  { value: 'accident', label: '사고' },
  { value: 'highlight', label: '하이라이트' },
  { value: 'other', label: '기타' },
]

type Event = {
  id: string
  title: string
  type: string
  occurred_at: string | null
  is_published: boolean
  created_at: string
}

export default function AdminEventsClient({ events, total, totalPages, currentPage, pageSize: initialPageSize, search: initialSearch, type: initialType }: { events: Event[]; total: number; totalPages: number; currentPage: number; pageSize: number; search: string; type: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(initialSearch)
  const [pageSize, setPageSize] = useState(String(initialPageSize))
  const [type, setType] = useState(initialType)
  const filtered = events
  function updateQuery(changes: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

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
            onKeyDown={(e) => { if (e.key === 'Enter') updateQuery({ search: e.currentTarget.value }) }}
            placeholder="제목 검색"
            className="rounded border border-zinc-700 bg-zinc-900 py-2 pl-7 pr-7 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X size={12} />
            </button>
          )}
        </div>
        <select value={type} onChange={(e) => { setType(e.target.value); updateQuery({ type: e.target.value }) }} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-2 text-xs text-zinc-300" aria-label="사건 유형 필터">
          <option value="">전체 유형</option>
          {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <span className="text-xs text-zinc-600">
          {filtered.length} / {total}건
        </span>
        <select value={pageSize} onChange={(e) => { setPageSize(e.target.value); updateQuery({ pageSize: e.target.value }) }} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-2 text-xs text-zinc-300"><option value="10">10개씩</option><option value="20">20개씩</option><option value="30">30개씩</option><option value="40">40개씩</option><option value="50">50개씩</option></select>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-900">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">제목</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 w-24">유형</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 w-32">발생일</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 w-20">상태</th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-600">
                  {initialSearch || initialType ? '조건에 맞는 사건이 없습니다.' : '등록된 사건이 없습니다.'}
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id} className="border-t border-zinc-800 hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-white">{e.title}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{typeLabel[e.type] ?? e.type}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {e.occurred_at ? formatKstDateTime(e.occurred_at) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <TogglePublishButton id={e.id} isPublished={e.is_published} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/events/${e.id}/edit`}
                        className="inline-flex cursor-pointer rounded p-1 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                      >
                        <Pencil size={13} />
                      </Link>
                      <EventDeleteButton id={e.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && <nav className="flex items-center justify-center gap-2 pt-2" aria-label="사건 페이지 이동"><button type="button" onClick={() => updateQuery({ page: String(currentPage - 1) })} disabled={currentPage <= 1} className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 disabled:opacity-40">이전</button><span className="text-xs text-zinc-500">{currentPage} / {totalPages}</span><button type="button" onClick={() => updateQuery({ page: String(currentPage + 1) })} disabled={currentPage >= totalPages} className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 disabled:opacity-40">다음</button></nav>}
    </div>
  )
}
