'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import ReportStatusSelect from './ReportStatusSelect'
import BlockIpButton from './BlockIpButton'
import ReportCoordAction from './ReportCoordAction'
import type { Report } from '@/types/database'

function stripCoordLine(content: string): string {
  return content.replace(/\n\n\[지도 좌표\] X: [-\d.]+, Y: [-\d.]+$/, '').trim()
}

const typeLabel: Record<string, string> = {
  new_character: '새 캐릭터',
  new_event: '새 사건',
  correction: '수정 요청',
  other: '기타',
}

function getSafeReferenceUrl(value: string | null): string | null {
  if (!value) return null

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : null
  } catch {
    return null
  }
}

export default function AdminReportsClient({ reports }: { reports: Report[] }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return reports
    return reports.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        r.contact?.toLowerCase().includes(q)
    )
  }, [reports, search])

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
            placeholder="제목, 내용, 연락처 검색"
            className="rounded border border-zinc-700 bg-zinc-900 py-2 pl-7 pr-7 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none w-64"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X size={12} />
            </button>
          )}
        </div>
        <span className="text-xs text-zinc-600">
          {search ? `${filtered.length} / ${reports.length}건` : `${reports.length}건`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-20 text-center text-sm text-zinc-600">
          {search ? '검색 결과가 없습니다.' : '해당하는 제보가 없습니다.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                      {typeLabel[r.type]}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {new Date(r.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="font-bold text-white">{r.title}</p>
                </div>
                <ReportStatusSelect id={r.id} status={r.status} />
              </div>

              <p className="text-sm text-zinc-400 whitespace-pre-wrap">{stripCoordLine(r.content)}</p>

              <ReportCoordAction content={r.content} title={r.title} />

              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 border-t border-zinc-800 pt-3">
                {(r.contact || r.contact_method) && (
                  <span>
                    연락처:{' '}
                    <span className="text-zinc-400">
                      {[r.contact_method, r.contact].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                )}
                {getSafeReferenceUrl(r.reference_url) && (
                  <a href={getSafeReferenceUrl(r.reference_url)!} target="_blank" rel="noopener noreferrer"
                    className="text-amber-400 hover:underline truncate max-w-xs">
                    참고 링크 →
                  </a>
                )}
                {r.ip_hash && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="font-mono text-zinc-600" title="IP 해시">
                      {r.ip_hash.slice(0, 12)}…
                    </span>
                    <BlockIpButton ipHash={r.ip_hash} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
