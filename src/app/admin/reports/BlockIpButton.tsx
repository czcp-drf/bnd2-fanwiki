'use client'

import { useState, useTransition } from 'react'
import { blockIp } from './actions'

export default function BlockIpButton({ ipHash }: { ipHash: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleBlock() {
    if (!confirm('이 IP 식별자를 차단하시겠습니까?')) return
    setError('')
    startTransition(async () => {
      try {
        const result = await blockIp(ipHash)
        if (result?.error) setError(result.error)
      } catch {
        setError('IP 차단 중 오류가 발생했습니다.')
      }
    })
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        onClick={handleBlock}
        disabled={pending}
        className="cursor-pointer rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? '차단 중…' : 'IP 차단'}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </span>
  )
}
