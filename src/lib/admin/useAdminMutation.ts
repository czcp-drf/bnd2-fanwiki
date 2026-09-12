'use client'

import { useRef, useState, useTransition } from 'react'

export function useAdminMutation() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const busy = useRef(false)
  function run(work: () => Promise<void>) {
    if (busy.current) return
    busy.current = true
    setError('')
    startTransition(async () => {
      try { await work() }
      catch (cause) { setError(cause instanceof Error ? cause.message : '처리하지 못했습니다. 다시 시도해주세요.') }
      finally { busy.current = false }
    })
  }
  return [pending, run, error] as const
}
