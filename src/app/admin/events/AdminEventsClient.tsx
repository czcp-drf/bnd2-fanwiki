'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X, Pencil } from 'lucide-react'
import EventDeleteButton from './EventDeleteButton'
import TogglePublishButton from './TogglePublishButton'

const typeLabel: Record<string, string> = {
  war: '전쟁/항쟁', crime: '범죄', political: '정치',
  social: '사회', accident: '사고', other: '기타',
}

type Event = {
  id: string
  title: string
  type: string
  occurred_at: string | null
  is_published: boolean
  created_at: string
}

export default function AdminEventsClient({ events }: { events: Event[] }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return events
    return events.filter(
      (e) => e.title.toLowerCase().includes(q) || (typeLabel[e.type] ?? e.type).toLowerCase().includes(q)
    )
  }, [events, search])

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
            placeholder="제목 또는 유형 검색"
            className="rounded border border-zinc-700 bg-zinc-900 py-2 pl-7 pr-7 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X size={12} />
            </button>
          )}
        </div>
        <span className="text-xs text-zinc-600">
          {search ? `${filtered.length} / ${events.length}건` : `${events.length}건`}
        </span>
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
                  {search ? '검색 결과가 없습니다.' : '등록된 사건이 없습니다.'}
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id} className="border-t border-zinc-800 hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-white">{e.title}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{typeLabel[e.type] ?? e.type}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {e.occurred_at
                      ? new Date(e.occurred_at).toLocaleString('ko-KR', {
                          year: 'numeric', month: '2-digit', day: '2-digit',
                          hour: '2-digit', minute: '2-digit', hour12: false,
                        })
                      : '—'}
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
    </div>
  )
}
