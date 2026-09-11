import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import ReportStatusSelect from './ReportStatusSelect'
import type { Report } from '@/types/database'

const typeLabel: Record<string, string> = {
  new_character: '새 캐릭터',
  new_event: '새 사건',
  correction: '수정 요청',
  other: '기타',
}

const filterOptions = [
  { value: '', label: '전체' },
  { value: 'pending', label: '대기중' },
  { value: 'reviewing', label: '검토중' },
  { value: 'applied', label: '반영됨' },
  { value: 'rejected', label: '반려됨' },
]

async function getReports(status: string) {
  const supabase = createAdminClient()
  let query = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data } = await query
  return (data ?? []) as Report[]
}

type Props = { searchParams: Promise<{ status?: string }> }

export default async function AdminReportsPage({ searchParams }: Props) {
  const { status = '' } = await searchParams
  const reports = await getReports(status)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">제보 관리</h1>
          <p className="text-sm text-zinc-500 mt-0.5">총 {reports.length}건</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filterOptions.map((opt) => (
            <Link
              key={opt.value}
              href={opt.value ? `/admin/reports?status=${opt.value}` : '/admin/reports'}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                status === opt.value
                  ? 'border-amber-400/50 bg-amber-400/10 text-amber-400'
                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-20 text-center text-sm text-zinc-600">
          해당하는 제보가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                      {typeLabel[r.type]}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {new Date(r.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="font-bold text-white">{r.title}</p>
                </div>
                <ReportStatusSelect id={r.id} status={r.status} />
              </div>

              <p className="text-sm text-zinc-400 whitespace-pre-wrap">{r.content}</p>

              <div className="flex flex-wrap gap-4 text-xs text-zinc-600 border-t border-zinc-800 pt-3">
                {(r.contact || r.contact_method) && (
                  <span>
                    연락처:{' '}
                    <span className="text-zinc-400">
                      {[r.contact_method, r.contact].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                )}
                {r.reference_url && (
                  <a href={r.reference_url} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline truncate max-w-xs">
                    참고 링크 →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
