import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import EventDeleteButton from './EventDeleteButton'
import TogglePublishButton from './TogglePublishButton'

const typeLabel: Record<string, string> = {
  war: '전쟁/항쟁', crime: '범죄', political: '정치',
  social: '사회', accident: '사고', other: '기타',
}

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
        <Link
          href="/admin/events/new"
          className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-zinc-900 hover:bg-amber-300 transition-colors"
        >
          <Plus size={13} />
          새 사건 작성
        </Link>
      </div>

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
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-600">
                  등록된 사건이 없습니다.
                </td>
              </tr>
            ) : (
              events.map((e) => (
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
