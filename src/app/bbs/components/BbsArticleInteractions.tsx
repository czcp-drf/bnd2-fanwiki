'use client'

import { useEffect, useState, useTransition } from 'react'
import { MessageCircle, ThumbsUp } from 'lucide-react'
import { getBbsArticleEngagementAction, toggleBbsArticleReaction } from '../actions'
import type { BbsArticleEngagement, BbsArticleReaction } from '@/lib/bbs/engagement'
import BbsShareButton from './BbsShareButton'

const LOCAL_REACTIONS_STORAGE_KEY = 'bbs-local-article-reactions'

function readLocalReaction(articleId: string): BbsArticleReaction | null {
  try {
    const stored = JSON.parse(window.localStorage.getItem(LOCAL_REACTIONS_STORAGE_KEY) ?? '{}') as Record<string, unknown>
    return stored[articleId] === 'like' || stored[articleId] === 'dislike' ? stored[articleId] : null
  } catch {
    return null
  }
}

function writeLocalReaction(articleId: string, reaction: BbsArticleReaction | null) {
  const stored: Record<string, unknown> = (() => {
    try {
      return JSON.parse(window.localStorage.getItem(LOCAL_REACTIONS_STORAGE_KEY) ?? '{}') as Record<string, unknown>
    } catch {
      return {}
    }
  })()
  if (reaction) stored[articleId] = reaction
  else delete stored[articleId]
  window.localStorage.setItem(LOCAL_REACTIONS_STORAGE_KEY, JSON.stringify(stored))
}

function reactionButtonClass(active: boolean, tone: 'like' | 'dislike') {
  if (active) return tone === 'like' ? 'text-[#D84017]' : 'text-sky-500'
  return 'text-[var(--bbs-subtle-text)] hover:bg-[var(--bbs-muted)] hover:text-[var(--bbs-text)]'
}

export default function BbsArticleInteractions({ articleId }: { articleId: string }) {
  const [engagement, setEngagement] = useState<BbsArticleEngagement | null>(null)
  const [localReaction, setLocalReaction] = useState<BbsArticleReaction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reactionCooldownUntil, setReactionCooldownUntil] = useState(0)
  const [rateLimitTooltip, setRateLimitTooltip] = useState<BbsArticleReaction | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let active = true
    startTransition(async () => {
      const result = await getBbsArticleEngagementAction(articleId)
      if (!active) return
      setEngagement(result)
      if (result.reactionMode === 'local') setLocalReaction(readLocalReaction(articleId))
      else setLocalReaction(result.viewerReaction)
    })
    return () => { active = false }
  }, [articleId])

  const handleReaction = (reaction: BbsArticleReaction) => {
    if (isPending || !engagement) return
    if (engagement.reactionMode === 'server' && reactionCooldownUntil > Date.now()) {
      setRateLimitTooltip(reaction)
      window.setTimeout(() => setRateLimitTooltip(null), 1800)
      return
    }
    if (engagement.reactionMode === 'local') {
      const nextReaction = localReaction === reaction ? null : reaction
      writeLocalReaction(articleId, nextReaction)
      setLocalReaction(nextReaction)
      return
    }
    const previous = engagement
    const nextReaction = previous.viewerReaction === reaction ? null : reaction
    setEngagement({
      ...previous,
      likeCount: previous.likeCount + (nextReaction === 'like' ? 1 : previous.viewerReaction === 'like' ? -1 : 0),
      dislikeCount: previous.dislikeCount + (nextReaction === 'dislike' ? 1 : previous.viewerReaction === 'dislike' ? -1 : 0),
      viewerReaction: nextReaction,
    })
    setError(null)
    startTransition(async () => {
      const result = await toggleBbsArticleReaction(articleId, reaction)
      if (result.error) {
        setEngagement(previous)
        setError(result.error)
        if (result.rateLimited) {
          setReactionCooldownUntil(Date.now() + result.retryAfterSeconds * 1000)
          setRateLimitTooltip(reaction)
          window.setTimeout(() => setRateLimitTooltip(null), 1800)
        }
        return
      }
      setReactionCooldownUntil(Date.now() + 30 * 1000)
    })
  }

  return (
    <>
      <div className="mt-8 border-t border-[var(--bbs-border)] pt-4">
        <div className="flex items-center justify-end gap-1 text-sm">
          <div className="relative">
            <button type="button" onClick={() => handleReaction('like')} disabled={isPending || !engagement} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${reactionButtonClass((engagement?.reactionMode === 'local' ? localReaction : engagement?.viewerReaction) === 'like', 'like')}`} aria-label="기사 좋아요">
              <ThumbsUp size={18} fill={(engagement?.reactionMode === 'local' ? localReaction : engagement?.viewerReaction) === 'like' ? 'currentColor' : 'none'} />
              <span>{engagement?.reactionMode === 'local' ? (localReaction === 'like' ? 1 : 0) : engagement?.likeCount ?? 0}</span>
            </button>
            {rateLimitTooltip === 'like' && <span role="status" className="pointer-events-none absolute bottom-full right-0 z-10 mb-2 whitespace-nowrap rounded-lg bg-[var(--bbs-text)] px-3 py-2 text-xs text-[var(--bbs-surface)] shadow-lg">잠시 후 다시 눌러주세요.</span>}
          </div>
          <button type="button" className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-[var(--bbs-subtle-text)] transition-colors hover:bg-[var(--bbs-muted)] hover:text-[var(--bbs-text)]" aria-label="기사 댓글 보기">
            <MessageCircle size={18} />
          </button>
          <BbsShareButton />
        </div>
        {error && <p className="mt-2 text-xs text-rose-500" role="status">{error}</p>}
      </div>

    </>
  )
}
