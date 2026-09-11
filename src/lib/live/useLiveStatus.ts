'use client'

import { useEffect, useState } from 'react'
import { parseLiveStatus, type LiveMap } from './status'

export function useLiveStatus(ids: string, enabled: boolean) {
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState<{ ids: string; map: LiveMap; checkedAt: number | null; refreshing: boolean }>({ ids: '', map: {}, checkedAt: null, refreshing: false })

  useEffect(() => {
    if (!enabled || !ids) return
    const controller = new AbortController()
    const channelIds = [...new Set(ids.split(',').filter(Boolean))]
    let running = false
    async function refresh() {
      if (running || controller.signal.aborted) return
      running = true
      setState((previous) => ({ ...previous, refreshing: true }))
      const map: LiveMap = {}
      // Limit parallel upstream requests; preserve successful batches on partial failure.
      for (let i = 0; i < channelIds.length; i += 20) {
        if (controller.signal.aborted) return
        const batch = channelIds.slice(i, i + 20)
        try {
          const response = await fetch(`/api/live-status?ids=${batch.join(',')}`, {
            cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
          })
          if (!response.ok) throw new Error('Live status request failed')
          const data = await response.json()
          for (const id of batch) map[id] = parseLiveStatus(data?.[id])
        } catch {
          for (const id of batch) map[id] = { live: null, title: null }
        }
      }
      if (!controller.signal.aborted) setState({ ids, map, checkedAt: Date.now(), refreshing: false })
      running = false
    }
    void refresh()
    const interval = setInterval(() => { if (!document.hidden) void refresh() }, 60000)
    const onVisible = () => { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      controller.abort()
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [ids, enabled, revision])

  return {
    map: state.ids === ids ? state.map : {},
    loading: Boolean(ids) && (state.ids !== ids || state.checkedAt === null),
    refreshing: state.refreshing,
    checkedAt: state.ids === ids ? state.checkedAt : null,
    retry: () => setRevision((value) => value + 1),
  }
}
