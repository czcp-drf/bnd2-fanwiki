'use client'

import { useState, useTransition } from 'react'
import { Heart, MessageCircle, Send, X } from 'lucide-react'
import { getBongstagramComments, toggleBongstagramLike, type BongstagramComment } from './actions'

function formatCommentDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function BongstagramPostInteractions({
  postId,
  initialLikeCount = 0,
  initialCommentCount = 0,
  initialLiked = false,
}: {
  postId: string
  initialLikeCount?: number
  initialCommentCount?: number
  initialLiked?: boolean
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
      {!!initialCommentCount && (
        <button type="button" onClick={handleCommentsOpen} className="block text-sm text-left text-zinc-400 transition-colors hover:text-zinc-200">
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
              <h2 id={`comments-title-${postId}`} className="text-sm font-semibold text-zinc-100">댓글</h2>
              <button type="button" aria-label="댓글창 닫기" onClick={() => setCommentsOpen(false)} className="text-zinc-400 transition-colors hover:text-white">
                <X size={20} />
              </button>
            </header>
            <div className="overflow-y-auto px-5 py-4">
              {isPending && !commentsLoaded ? (
                <p className="py-8 text-center text-sm text-zinc-500">댓글을 불러오는 중입니다.</p>
              ) : comments.length > 0 ? (
                <div className="space-y-5">
                  {comments.map((comment) => (
                    <article key={comment.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-zinc-200">{comment.author_name}</p>
                        <time className="shrink-0 text-[11px] text-zinc-600" dateTime={comment.created_at}>{formatCommentDate(comment.created_at)}</time>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-400">{comment.content}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-zinc-500">아직 댓글이 없습니다.</p>
              )}
            </div>
            <p className="border-t border-zinc-800 px-5 py-3 text-center text-xs text-zinc-600">댓글 작성은 운영진만 가능합니다.</p>
          </section>
        </div>
      )}
    </>
  )
}
