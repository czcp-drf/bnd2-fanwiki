'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-8 py-10 space-y-4 max-w-md w-full">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 mx-auto">
          <span className="text-red-400 text-xl font-bold">!</span>
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">페이지를 불러오지 못했습니다</h2>
          <p className="text-sm text-zinc-500">일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.</p>
        </div>
        <button
          onClick={reset}
          className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-bold text-zinc-900 hover:bg-amber-300 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}
