'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { BBS_SCROLL_STATE_PREFIX } from '@/app/bbs/components/BbsArticleCard'

export default function BbsHomeLink(props: Omit<ComponentProps<typeof Link>, 'href'>) {
  function clearBbsScrollStates() {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index)
      if (key?.startsWith(BBS_SCROLL_STATE_PREFIX)) sessionStorage.removeItem(key)
    }
  }

  return <Link {...props} href="/bbs" onClick={(event) => { clearBbsScrollStates(); props.onClick?.(event) }} />
}
