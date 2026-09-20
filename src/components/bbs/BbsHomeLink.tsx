'use client'

import type { ComponentProps } from 'react'
import { useRouter } from 'next/navigation'
import { BBS_LIST_REVISION_STORAGE_KEY, BBS_SCROLL_STATE_PREFIX } from '@/app/bbs/components/BbsArticleCard'

export default function BbsHomeLink(props: Omit<ComponentProps<'a'>, 'href'>) {
  const router = useRouter()

  function clearBbsScrollStates() {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index)
      if (key?.startsWith(BBS_SCROLL_STATE_PREFIX)) sessionStorage.removeItem(key)
    }
  }

  async function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    clearBbsScrollStates()
    props.onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    const knownRevision = sessionStorage.getItem(BBS_LIST_REVISION_STORAGE_KEY)
    if (!knownRevision) return

    event.preventDefault()
    try {
      const response = await fetch('/api/bbs/revision', { cache: 'no-store' })
      const payload = await response.json() as { revision?: unknown }
      if (!response.ok || typeof payload.revision !== 'string' || payload.revision !== knownRevision) {
        window.location.assign('/bbs')
        return
      }
      router.push('/bbs')
    } catch {
      window.location.assign('/bbs')
    }
  }

  return <a {...props} href="/bbs" onClick={handleClick} />
}
