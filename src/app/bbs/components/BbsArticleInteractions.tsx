'use client'

import { useEffect, useState, useTransition } from 'react'
import { ArrowLeft, MessageCircle, ThumbsDown, ThumbsUp } from 'lucide-react'
import { getBbsArticleCommentsAction, toggleBbsArticleReaction } from '../actions'
import type { BbsArticleComment, BbsArticleEngagement, BbsArticleReaction } from '@/lib/bbs/engagement'
import BbsShareButton from './BbsShareButton'
import BongstagramDisplayName from '@/app/bongstagram/BongstagramDisplayName'
import BongstagramProfileAvatar from '@/app/bongstagram/BongstagramProfileAvatar'

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

function formatCommentTime(value: string) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (elapsedSeconds < 60) return '방금 전'
  if (elapsedSeconds < 60 * 60) return `${Math.floor(elapsedSeconds / 60)}분 전`
  if (elapsedSeconds < 24 * 60 * 60) return `${Math.floor(elapsedSeconds / (60 * 60))}시간 전`
  const parts = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' }).formatToParts(new Date(value))
  return `${parts.find((part) => part.type === 'month')?.value ?? ''}월 ${parts.find((part) => part.type === 'day')?.value ?? ''}일`
}

function reactionButtonClass(active: boolean, tone: 'like' | 'dislike') {
  if (active) return tone === 'like' ? 'text-[#D84017]' : 'text-sky-500'
  return 'text-[var(--bbs-subtle-text)] hover:bg-[var(--bbs-muted)] hover:text-[var(--bbs-text)]'
}

export default function BbsArticleInteractions({ articleId, initial }: { articleId: string; initial: BbsArticleEngagement }) {
  const [engagement, setEngagement] = useState(initial)
  const [localReaction, setLocalReaction] = useState<BbsArticleReaction | null>(initial.reactionMode === 'local' ? null : initial.viewerReaction)
  const [comments, setComments] = useState<BbsArticleComment[]>([])
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reactionCooldownUntil, setReactionCooldownUntil] = useState(0)
  const [rateLimitTooltip, setRateLimitTooltip] = useState<BbsArticleReaction | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (initial.reactionMode !== 'local' || typeof window === 'undefined') return
    const timer = window.setTimeout(() => {
      const storedReaction = readLocalReaction(articleId)
      if (storedReaction) setLocalReaction(storedReaction)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [articleId, initial.reactionMode])

  const handleReaction = (reaction: BbsArticleReaction) => {
    if (isPending) return
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

  const openComments = () => {
    setCommentsOpen(true)
    if (commentsLoaded || isPending) return
    startTransition(async () => {
      const result = await getBbsArticleCommentsAction(articleId)
      if (result.error) setError(result.error)
      setComments(result.comments)
      setCommentsLoaded(true)
    })
  }

  return (
    <>
      <div className="mt-8 border-t border-[var(--bbs-border)] pt-4">
        <div className="flex items-center justify-end gap-1 text-sm">
          <div className="relative">
            <button type="button" onClick={() => handleReaction('like')} disabled={isPending} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${reactionButtonClass((engagement.reactionMode === 'local' ? localReaction : engagement.viewerReaction) === 'like', 'like')}`} aria-label="기사 좋아요">
              <ThumbsUp size={18} fill={(engagement.reactionMode === 'local' ? localReaction : engagement.viewerReaction) === 'like' ? 'currentColor' : 'none'} />
              <span>{engagement.reactionMode === 'local' ? (localReaction === 'like' ? 1 : 0) : engagement.likeCount}</span>
            </button>
            {rateLimitTooltip === 'like' && <span role="status" className="pointer-events-none absolute bottom-full right-0 z-10 mb-2 whitespace-nowrap rounded-lg bg-[var(--bbs-text)] px-3 py-2 text-xs text-[var(--bbs-surface)] shadow-lg">잠시 후 다시 눌러주세요.</span>}
          </div>
          <div className="relative">
            <button type="button" onClick={() => handleReaction('dislike')} disabled={isPending} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${reactionButtonClass((engagement.reactionMode === 'local' ? localReaction : engagement.viewerReaction) === 'dislike', 'dislike')}`} aria-label="기사 싫어요">
              <ThumbsDown size={18} fill={(engagement.reactionMode === 'local' ? localReaction : engagement.viewerReaction) === 'dislike' ? 'currentColor' : 'none'} />
              <span>{engagement.reactionMode === 'local' ? (localReaction === 'dislike' ? 1 : 0) : engagement.dislikeCount}</span>
            </button>
            {rateLimitTooltip === 'dislike' && <span role="status" className="pointer-events-none absolute bottom-full right-0 z-10 mb-2 whitespace-nowrap rounded-lg bg-[var(--bbs-text)] px-3 py-2 text-xs text-[var(--bbs-surface)] shadow-lg">잠시 후 다시 눌러주세요.</span>}
          </div>
          <button type="button" onClick={openComments} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-[var(--bbs-subtle-text)] transition-colors hover:bg-[var(--bbs-muted)] hover:text-[var(--bbs-text)]" aria-label="기사 댓글 보기">
            <MessageCircle size={18} />
            <span>{engagement.commentCount}</span>
          </button>
          <BbsShareButton />
        </div>
        {error && <p className="mt-2 text-xs text-rose-500" role="status">{error}</p>}
      </div>

      {commentsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4" role="presentation" onClick={() => setCommentsOpen(false)}>
          <section className="flex max-h-[min(75vh,42rem)] w-full max-w-2xl flex-col rounded-t-2xl border border-[var(--bbs-border)] bg-[var(--bbs-surface)] text-[var(--bbs-text)] shadow-2xl sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="bbs-comments-title" onClick={(event) => event.stopPropagation()}>
            <header className="relative flex items-center justify-center border-b border-[var(--bbs-border)] px-4 py-4">
              <button type="button" onClick={() => setCommentsOpen(false)} className="absolute left-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[var(--bbs-subtle-text)] transition-colors hover:bg-[var(--bbs-muted)] hover:text-[var(--bbs-text)]" aria-label="댓글 닫기"><ArrowLeft size={20} /></button>
              <h2 id="bbs-comments-title" className="text-sm font-semibold">댓글</h2>
            </header>
            <div className="overflow-y-auto px-5 py-4">
              {isPending && !commentsLoaded ? <p className="py-10 text-center text-sm text-[var(--bbs-subtle-text)]">댓글을 불러오는 중입니다.</p> : comments.length === 0 ? <p className="py-10 text-center text-sm text-[var(--bbs-subtle-text)]">등록된 댓글이 없습니다.</p> : <div className="space-y-5">{comments.map((comment) => { const profileName = comment.characterName ?? comment.authorName; return <article key={comment.id} className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--bbs-muted)] text-xs font-bold text-[var(--bbs-subtle-text)]"><BongstagramProfileAvatar profileAvatarUrl={comment.characterAvatarUrl} streamerAvatarUrl={comment.streamerAvatarUrl} profileName={profileName} streamerName={comment.streamerName} fallbackText={profileName.slice(0, 1)} className="h-full w-full object-cover" /></div><div className="min-w-0"><div className="flex items-center gap-2"><strong className="text-sm"><BongstagramDisplayName profileName={profileName} streamerName={comment.streamerName} /></strong><time className="text-xs text-[var(--bbs-subtle-text)]" dateTime={comment.createdAt}>{formatCommentTime(comment.createdAt)}</time></div><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--bbs-subtle-text)]">{comment.content}</p></div></article> })}</div>}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
