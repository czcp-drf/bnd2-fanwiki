'use client'

import { useTransition } from 'react'
import { blockIp } from './actions'

export default function BlockIpButton({ ip }: { ip: string }) {
  const [pending, startTransition] = useTransition()

  function handleBlock() {
    if (!confirm(`${ip} 를 차단하시겠습니까?`)) return
    startTransition(() => blockIp(ip))
  }

  return (
    <button
      onClick={handleBlock}
      disabled={pending}
      className="rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
    >
      {pending ? '차단 중…' : 'IP 차단'}
    </button>
  )
}
