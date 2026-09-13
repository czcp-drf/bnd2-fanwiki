'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, useTransition, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Heart, MessageCircle, Send } from 'lucide-react'
import { getBongstagramComments, getBongstagramLikeCounts, toggleBongstagramLike, type BongstagramComment } from './actions'
import type { BongstagramLikeMode } from '@/lib/bongstagram/like-mode'
import BongstagramDisplayName from './BongstagramDisplayName'
import BongstagramProfileAvatar from './BongstagramProfileAvatar'

function formatCommentDate(value: string) {
  const elapsed = Date.now() - new Date(value).getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (elapsed < minute) return '방금 전'
  if (elapsed < hour) return `${Math.floor(elapsed / minute)}분 전`
  if (elapsed < day) return `${Math.floor(elapsed / hour)}시간 전`

  const dateParts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date(value))
  const month = dateParts.find((part) => part.type === 'month')?.value
  const dayOfMonth = dateParts.find((part) => part.type === 'day')?.value
  return `${month}월 ${dayOfMonth}일`
}

function CommentThread({ comment, repliesByParent, depth = 0 }: { comment: BongstagramComment; repliesByParent: Map<string, BongstagramComment[]>; depth?: number }) {
  const replies = repliesByParent.get(comment.id) ?? []
  const profileHref = comment.author_character_id ? `/bongstagram/${comment.author_character_id}` : null
  return (
    <div>
      <article className={`flex items-start gap-3 ${depth > 0 ? 'ml-10' : ''}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
          {profileHref ? (
            <Link href={profileHref} aria-label={`${comment.author_name} 프로필 보기`} className="flex h-full w-full cursor-pointer items-center justify-center">
              <BongstagramProfileAvatar
                profileAvatarUrl={comment.profile_avatar_url}
                streamerAvatarUrl={comment.streamer_avatar_url}
                profileName={comment.author_name}
                streamerName={comment.streamer_name}
                fallbackText={comment.author_name.trim().slice(0, 1) || '?'}
                className="h-full w-full object-cover"
              />
            </Link>
          ) : (
            <BongstagramProfileAvatar
              profileAvatarUrl={comment.profile_avatar_url}
              streamerAvatarUrl={comment.streamer_avatar_url}
              profileName={comment.author_name}
              streamerName={comment.streamer_name}
              fallbackText={comment.author_name.trim().slice(0, 1) || '?'}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="shrink-0 text-sm font-semibold text-zinc-200">{profileHref ? <Link href={profileHref} className="cursor-pointer transition-colors hover:text-fuchsia-300"><BongstagramDisplayName profileName={comment.author_name} streamerName={comment.streamer_name} /></Link> : <BongstagramDisplayName profileName={comment.author_name} streamerName={comment.streamer_name} />}</p>
            <p className="min-w-0 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-400">{comment.content}</p>
          </div>
          <time className="mt-0.5 block text-[11px] text-zinc-600" dateTime={comment.created_at}>{formatCommentDate(comment.created_at)}</time>
        </div>
      </article>
      {replies.length > 0 && <div className="mt-4 space-y-4">{replies.map((reply) => <CommentThread key={reply.id} comment={reply} repliesByParent={repliesByParent} depth={depth + 1} />)}</div>}
    </div>
  )
}

const LIKE_COUNT_REFRESH_MS = 60_000
const LOCAL_POST_LIKES_STORAGE_KEY = 'bongstagram-local-post-likes'

function readStoredPostLikes() {
  if (typeof window === 'undefined') return new Set<string>()
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(LOCAL_POST_LIKES_STORAGE_KEY) ?? '[]')
    return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

function writeStoredPostLikes(likedIds: Set<string>) {
  window.localStorage.setItem(LOCAL_POST_LIKES_STORAGE_KEY, JSON.stringify(Array.from(likedIds)))
  window.dispatchEvent(new Event('bongstagram-local-post-likes-change'))
}

function subscribeStoredPostLikes(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener('bongstagram-local-post-likes-change', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('bongstagram-local-post-likes-change', callback)
  }
}

function getStoredPostLikesSnapshot() {
  return window.localStorage.getItem(LOCAL_POST_LIKES_STORAGE_KEY) ?? '[]'
}

function getServerStoredPostLikesSnapshot() {
  return '[]'
}

function parseStoredPostLikes(snapshot: string) {
  try {
    const value: unknown = JSON.parse(snapshot)
    return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

type LikeCountContextValue = {
  mode: BongstagramLikeMode
  counts: Map<string, number>
  isLiked: (postId: string) => boolean
  toggleLocalLike: (postId: string) => void
  adjust: (postId: string, delta: number) => void
}

const LikeCountContext = createContext<LikeCountContextValue | null>(null)

export function BongstagramLikeCountProvider({ postIds, initialLikeCounts, initialLikedPostIds = [], likeMode, children }: { postIds: string[]; initialLikeCounts: Record<string, number>; initialLikedPostIds?: string[]; likeMode: BongstagramLikeMode; children: ReactNode }) {
  const normalizedPostIds = useMemo(() => Array.from(new Set(postIds)), [postIds])
  const storedPostLikesSnapshot = useSyncExternalStore(subscribeStoredPostLikes, getStoredPostLikesSnapshot, getServerStoredPostLikesSnapshot)
  const localLikedPostIds = useMemo(() => parseStoredPostLikes(storedPostLikesSnapshot), [storedPostLikesSnapshot])
  const [refreshedLikeCounts, setRefreshedLikeCounts] = useState<Map<string, number> | null>(null)
  const [likeAdjustments, setLikeAdjustments] = useState<Map<string, number>>(() => new Map())

  const baseLikeCounts = useMemo(() => {
    const next = new Map(Object.entries(initialLikeCounts))
    refreshedLikeCounts?.forEach((count, postId) => next.set(postId, count))
    return next
  }, [initialLikeCounts, refreshedLikeCounts])

  const adjustLikeCount = useCallback((postId: string, delta: number) => {
    setLikeAdjustments((current) => {
      const next = new Map(current)
      next.set(postId, (next.get(postId) ?? 0) + delta)
      return next
    })
  }, [])

  const toggleLocalLike = useCallback((postId: string) => {
    const next = new Set(parseStoredPostLikes(getStoredPostLikesSnapshot()))
    if (next.has(postId)) next.delete(postId)
    else next.add(postId)
    writeStoredPostLikes(next)
  }, [])

  const counts = useMemo(() => {
    const next = new Map(baseLikeCounts)
    likeAdjustments.forEach((delta, postId) => next.set(postId, Math.max(0, (next.get(postId) ?? 0) + delta)))
    if (likeMode === 'local') {
      initialLikedPostIds.forEach((postId) => next.set(postId, Math.max(0, (next.get(postId) ?? 0) - 1)))
      localLikedPostIds.forEach((postId) => next.set(postId, (next.get(postId) ?? 0) + 1))
    }
    return next
  }, [baseLikeCounts, initialLikedPostIds, likeAdjustments, likeMode, localLikedPostIds])

  const isLiked = useCallback((postId: string) => localLikedPostIds.has(postId), [localLikedPostIds])

  useEffect(() => {
    let cancelled = false

    async function refreshLikeCounts() {
      if (likeMode === 'local') return
      if (document.visibilityState !== 'visible') return
      const result = await getBongstagramLikeCounts(normalizedPostIds)
      if (cancelled || !result.counts) return
      setRefreshedLikeCounts(new Map(Object.entries(result.counts)))
      setLikeAdjustments(new Map())
    }

    const intervalId = window.setInterval(refreshLikeCounts, LIKE_COUNT_REFRESH_MS)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshLikeCounts()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [likeMode, normalizedPostIds])

  const contextValue = useMemo(() => ({ mode: likeMode, counts, isLiked, toggleLocalLike, adjust: adjustLikeCount }), [adjustLikeCount, counts, isLiked, likeMode, toggleLocalLike])
  return <LikeCountContext.Provider value={contextValue}>{children}</LikeCountContext.Provider>
}

export default function BongstagramPostInteractions({
  postId,
  initialLikeCount = 0,
  initialCommentCount = 0,
  initialLiked = false,
  caption,
  likeMode,
}: {
  postId: string
  initialLikeCount?: number
  initialCommentCount?: number
  initialLiked?: boolean
  caption?: ReactNode
  likeMode?: BongstagramLikeMode
}) {
  const [liked, setLiked] = useState(initialLiked)
  const [localLikeCount, setLocalLikeCount] = useState(initialLikeCount)
  const likeCountContext = useContext(LikeCountContext)
  const likeCount = likeCountContext?.counts.get(postId) ?? localLikeCount
  const displayedLiked = likeCountContext?.mode === 'local' ? likeCountContext.isLiked(postId) : liked
  const [comments, setComments] = useState<BongstagramComment[]>([])
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleLike = () => {
    if (isPending) return
    setError('')
    if (likeCountContext?.mode === 'local' || likeMode === 'local') {
      if (likeCountContext) {
        likeCountContext.toggleLocalLike(postId)
      } else {
        const storedLikes = readStoredPostLikes()
        const nextLiked = !storedLikes.has(postId)
        if (nextLiked) storedLikes.add(postId)
        else storedLikes.delete(postId)
        writeStoredPostLikes(storedLikes)
        setLiked(nextLiked)
        setLocalLikeCount((current) => Math.max(0, current + (nextLiked ? 1 : -1)))
      }
      return
    }
    startTransition(async () => {
      const result = await toggleBongstagramLike(postId)
      if (result.error) {
        setError(result.error)
        return
      }
      const nextLiked = result.liked ?? !liked
      setLiked(nextLiked)
      if (likeCountContext) {
        likeCountContext.adjust(postId, nextLiked ? 1 : -1)
      } else {
        setLocalLikeCount((current) => Math.max(0, current + (nextLiked ? 1 : -1)))
      }
    })
  }

  const handleCommentsOpen = () => {
    setCommentsOpen(true)
    setError('')
    if (commentsLoaded) return

    startTransition(async () => {
      const result = await getBongstagramComments(postId)
      if (result.error) {
        setError(result.error)
        return
      }
      setComments(result.comments ?? [])
      setCommentsLoaded(true)
    })
  }

  return (
    <>
      <div className="flex items-center gap-4 text-zinc-300">
        <button
          type="button"
          aria-label={displayedLiked ? '좋아요 취소' : '좋아요'}
          aria-pressed={displayedLiked}
          disabled={isPending}
          onClick={handleLike}
          className="transition-colors hover:text-rose-400 disabled:cursor-wait disabled:opacity-60"
        >
          <Heart size={23} fill={displayedLiked ? 'currentColor' : 'none'} className={displayedLiked ? 'text-rose-500' : ''} />
        </button>
        <button
          type="button"
          aria-label="댓글 보기"
          onClick={handleCommentsOpen}
          className="transition-colors hover:text-fuchsia-300"
        >
          <MessageCircle size={23} />
        </button>
        <Send size={22} />
      </div>
      {!!likeCount && <p className="text-sm font-semibold text-zinc-200">좋아요 {likeCount}개</p>}
      {caption}
      {!!initialCommentCount && (
        <button type="button" onClick={handleCommentsOpen} className="block cursor-pointer text-left text-sm text-zinc-400 transition-colors hover:text-zinc-200">
          댓글 {initialCommentCount}개 모두 보기
        </button>
      )}
      {error && <p role="status" className="text-xs text-rose-400">{error}</p>}

      {commentsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setCommentsOpen(false)
          }}
        >
          <section className="flex max-h-[min(75vh,42rem)] w-full max-w-[540px] flex-col rounded-t-2xl border border-zinc-800 bg-zinc-950 sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby={`comments-title-${postId}`}>
            <header className="relative flex items-center border-b border-zinc-800 px-5 py-4">
              <h2 id={`comments-title-${postId}`} className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-white">댓글</h2>
              <button type="button" aria-label="댓글창 닫기" onClick={() => setCommentsOpen(false)} className="cursor-pointer text-zinc-400 transition-colors hover:text-white">
                <ArrowLeft size={23} />
              </button>
            </header>
            <div className="overflow-y-auto px-5 py-4">
              {isPending && !commentsLoaded ? (
                <p className="py-8 text-center text-sm text-zinc-500">댓글을 불러오는 중입니다.</p>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const commentsByParent = new Map<string, BongstagramComment[]>()
                    comments.forEach((comment) => {
                      if (!comment.parent_comment_id) return
                      const replies = commentsByParent.get(comment.parent_comment_id) ?? []
                      replies.push(comment)
                      commentsByParent.set(comment.parent_comment_id, replies)
                    })
                    return comments.filter((comment) => !comment.parent_comment_id || !comments.some((parent) => parent.id === comment.parent_comment_id)).map((comment) => (
                      <CommentThread key={comment.id} comment={comment} repliesByParent={commentsByParent} />
                    ))
                  })()}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-zinc-500">아직 댓글이 없습니다.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
