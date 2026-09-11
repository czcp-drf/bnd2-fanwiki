import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import AdminReportsClient from './AdminReportsClient'
import type { Report } from '@/types/database'

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
        <h1 className="text-xl font-black text-white">제보 관리</h1>
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

      <AdminReportsClient reports={reports} />
    </div>
  )
}
