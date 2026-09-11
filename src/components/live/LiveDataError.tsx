'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export default function LiveDataError() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <div role="alert" className="rounded-xl border border-amber-400/30 bg-zinc-900 p-6 text-sm text-zinc-400">
      <p>라이브 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      <button disabled={pending} onClick={() => startTransition(() => router.refresh())} className="mt-3 rounded border border-zinc-700 px-3 py-1.5 text-amber-400 disabled:opacity-50">
        {pending ? '불러오는 중…' : '다시 시도'}
      </button>
    </div>
  )
}
