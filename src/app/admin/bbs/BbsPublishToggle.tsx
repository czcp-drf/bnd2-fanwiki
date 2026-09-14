'use client'

import { useState } from 'react'
import { toggleBbsArticlePublished } from './actions'

export default function BbsPublishToggle({ id, isPublished }: { id: string; isPublished: boolean }) {
  const [published, setPublished] = useState(isPublished)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setPending(true)
    setError('')
    try {
      const result = await toggleBbsArticlePublished(id, published)
      if (result.error) setError(result.error)
      else setPublished((current) => !current)
    } catch {
      setError('공개 상태 변경 중 오류가 발생했습니다.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          published
            ? 'bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
        }`}
      >
        {pending ? '…' : published ? '공개' : '비공개'}
      </button>
      {error && <p className="max-w-32 text-xs text-red-400">{error}</p>}
    </div>
  )
}
