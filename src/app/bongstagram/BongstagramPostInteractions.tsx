'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { Heart, MessageCircle, Send, X } from 'lucide-react'
import { getBongstagramComments, toggleBongstagramLike, type BongstagramComment } from './actions'
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
  return (
    <div>
      <article className={`flex items-start gap-3 ${depth > 0 ? 'ml-10' : ''}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
          <BongstagramProfileAvatar
            profileAvatarUrl={comment.profile_avatar_url}
            streamerAvatarUrl={comment.streamer_avatar_url}
            profileName={comment.author_name}
            streamerName={comment.streamer_name}
            fallbackText={comment.author_name.trim().slice(0, 1) || '?'}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="shrink-0 text-sm font-semibold text-zinc-200"><BongstagramDisplayName profileName={comment.author_name} streamerName={comment.streamer_name} /></p>
            <p className="min-w-0 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-400">{comment.content}</p>
          </div>
          <time className="mt-0.5 block text-[11px] text-zinc-600" dateTime={comment.created_at}>{formatCommentDate(comment.created_at)}</time>
        </div>
      </article>
      {replies.length > 0 && <div className="mt-4 space-y-4">{replies.map((reply) => <CommentThread key={reply.id} comment={reply} repliesByParent={repliesByParent} depth={depth + 1} />)}</div>}
    </div>
  )
}

export default function BongstagramPostInteractions({
  postId,
  initialLikeCount = 0,
  initialCommentCount = 0,
  initialLiked = false,
  caption,
}: {
  postId: string
  initialLikeCount?: number
  initialCommentCount?: number
  initialLiked?: boolean
  caption?: ReactNode
}) {
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [comments, setComments] = useState<BongstagramComment[]>([])
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleLike = () => {
    if (isPending) return
    setError('')
    startTransition(async () => {
      const result = await toggleBongstagramLike(postId)
      if (result.error) {
        setError(result.error)
        return
      }
      setLiked(result.liked ?? !liked)
      setLikeCount(result.likeCount ?? likeCount)
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
          aria-label={liked ? '좋아요 취소' : '좋아요'}
          aria-pressed={liked}
          disabled={isPending}
          onClick={handleLike}
          className="transition-colors hover:text-rose-400 disabled:cursor-wait disabled:opacity-60"
        >
          <Heart size={23} fill={liked ? 'currentColor' : 'none'} className={liked ? 'text-rose-500' : ''} />
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
            <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <h2 id={`comments-title-${postId}`} className="text-sm font-semibold text-white">댓글</h2>
              <button type="button" aria-label="댓글창 닫기" onClick={() => setCommentsOpen(false)} className="text-zinc-400 transition-colors hover:text-white">
                <X size={20} />
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
