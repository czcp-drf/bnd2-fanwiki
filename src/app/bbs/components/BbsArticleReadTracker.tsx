'use client'

import { useEffect } from 'react'
import { markArticleAsRead } from './BbsArticleReadState'

export default function BbsArticleReadTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    markArticleAsRead(articleId)
  }, [articleId])

  return null
}
