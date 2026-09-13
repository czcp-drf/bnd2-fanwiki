'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { refreshBbsCache } from './actions'

export default function BbsCacheRefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')

  function handleRefresh() {
    setMessage('')
    startTransition(async () => {
      const result = await refreshBbsCache()
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
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-60"
      >
        <RefreshCw size={15} className={isPending ? 'animate-spin' : ''} />
        {isPending ? '갱신 중...' : '기사 캐시 갱신'}
      </button>
      {message && <span className="text-xs text-zinc-500" role="status">{message}</span>}
    </div>
  )
}
