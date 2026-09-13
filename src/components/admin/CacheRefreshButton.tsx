'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { refreshWikiCache } from '@/app/admin/cache-actions'
import type { WikiCacheScope } from '@/lib/cache/wiki'

const labels: Record<WikiCacheScope, string> = {
  characters: '캐릭터 캐시 갱신',
  streamers: '스트리머 캐시 갱신',
  organizations: '조직 캐시 갱신',
  events: '사건 캐시 갱신',
  map: '지도 캐시 갱신',
  relationships: '관계 캐시 갱신',
  reports: '제보 캐시 갱신',
}

export default function CacheRefreshButton({ scope }: { scope: WikiCacheScope }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')

  function handleRefresh() {
    setMessage('')
    startTransition(async () => {
      const result = await refreshWikiCache(scope)
      if (result.success) {
        setMessage('캐시를 갱신했습니다.')
        router.refresh()
      } else {
        setMessage(result.error ?? '캐시 갱신에 실패했습니다.')
      }
    })
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isPending}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-60"
      >
        <RefreshCw size={14} className={isPending ? 'animate-spin' : ''} />
        {isPending ? '갱신 중...' : labels[scope]}
      </button>
      {message && <span className="text-xs text-zinc-500" role="status">{message}</span>}
    </div>
  )
}
