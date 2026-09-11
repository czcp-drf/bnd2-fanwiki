'use client'

import { useState } from 'react'
import { togglePublish } from './actions'

export default function TogglePublishButton({ id, isPublished }: { id: string; isPublished: boolean }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setPending(true)
    setError('')
    try {
      const result = await togglePublish(id, isPublished)
      if (result?.error) {
        setError(result.error)
      }
    } catch {
      setError('상태 변경 중 오류가 발생했습니다.')
    }
    setPending(false)
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 ${
          isPublished
            ? 'bg-green-400/10 text-green-400 hover:bg-green-400/20'
            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
        }`}
      >
        {pending ? '…' : isPublished ? '공개' : '비공개'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
