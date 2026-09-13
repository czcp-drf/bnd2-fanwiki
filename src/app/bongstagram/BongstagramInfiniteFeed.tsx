'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import AppImage from '@/components/ui/AppImage'
import BongstagramVideoPlayer from './BongstagramVideoPlayer'
import BongstagramDisplayName from './BongstagramDisplayName'
import BongstagramProfileAvatar from './BongstagramProfileAvatar'
import MediaCarousel from './MediaCarousel'
import BongstagramPostInteractions, { BongstagramLikeCountProvider } from './BongstagramPostInteractions'
import BongstagramFeedOrder from './BongstagramFeedOrder'
import BongstagramFollowButton from './BongstagramFollowButton'
import { getBongstagramFeedPage, type BongstagramFeedPageResult } from './actions'
import type { BongstagramFeedMedia, BongstagramFeedPost, BongstagramPostCursor } from '@/lib/bongstagram/types'
import type { BongstagramLikeMode } from '@/lib/bongstagram/like-mode'

function FeedMedia({ media, label }: { media: BongstagramFeedMedia; label: string }) {
  return media.media_type === 'video'
    ? <BongstagramVideoPlayer src={media.media_url} label={label} />
    : <div className="relative w-full overflow-hidden bg-black" style={{ height: 'min(125vw, 675px)' }}>
      <AppImage src={media.media_url} alt={`${label} 게시물`} width={540} height={675} className="h-full w-full object-contain" style={{ objectFit: 'contain', objectPosition: 'center' }} />
    </div>
}

function formatPostTime(value: string) {
  const date = new Date(value)
  const elapsed = Math.max(0, Date.now() - date.getTime())
  const minuteMs = 60 * 1000
  const dayMs = 24 * 60 * 60 * 1000

  if (elapsed < minuteMs) return '방금 전'
  if (elapsed < dayMs) {
    const hour = 60 * minuteMs
    if (elapsed < hour) return `${Math.floor(elapsed / minuteMs)}분 전`
    return `${Math.floor(elapsed / hour)}시간 전`
  }

  const dateParts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date)
  const month = dateParts.find((part) => part.type === 'month')?.value
  const day = dateParts.find((part) => part.type === 'day')?.value
  return `${month}월 ${day}일`
}

function PostCaption({ post }: { post: BongstagramFeedPost }) {
  const parts = post.content.split(/(#[^\s#]+)/g)
  return (
    <p className="whitespace-pre-wrap break-words text-sm text-zinc-300">
      <Link href={`/bongstagram/${post.character_id}`} className="font-bold text-zinc-200 transition-colors hover:text-fuchsia-300"><BongstagramDisplayName profileName={post.profile_name} streamerName={post.streamer_name} /></Link>{' '}
      {parts.map((part, index) => part.startsWith('#')
        ? <Link key={`${part}-${index}`} href={`/bongstagram/hashtag/${encodeURIComponent(part.slice(1))}`} className="text-sky-400 hover:underline">{part}</Link>
        : <span key={`${part}-${index}`}>{part}</span>)}
    </p>
  )
}

function FeedPostCard({ post, likeMode }: { post: BongstagramFeedPost; likeMode: BongstagramLikeMode }) {
  return (
    <article className="border-b border-zinc-800">
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`/bongstagram/${post.character_id}`} aria-label={`${post.profile_name} 프로필 보기`} className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-bold text-zinc-200">
            <BongstagramProfileAvatar
              profileAvatarUrl={post.profile_avatar_url}
              streamerAvatarUrl={post.streamer_avatar_url}
              fallbackAvatarUrl={post.character_avatar_url}
              profileName={post.profile_name}
              streamerName={post.streamer_name}
              className="h-full w-full object-cover"
            />
          </Link>
          <div className="min-w-0">
            <Link href={`/bongstagram/${post.character_id}`} className="truncate text-sm font-semibold text-zinc-200 transition-colors hover:text-fuchsia-300"><BongstagramDisplayName profileName={post.profile_name} streamerName={post.streamer_name} /></Link>
          </div>
        </div>
        <BongstagramFollowButton characterId={post.character_id} />
      </header>

      {post.media.length > 0 ? (
        <MediaCarousel>
          {post.media.map((media) => (
            <div key={media.id} className="w-full min-w-0 max-w-full flex-none snap-center">
              <FeedMedia media={media} label={post.profile_name} />
            </div>
          ))}
        </MediaCarousel>
      ) : (
        <div className="flex min-h-56 items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-fuchsia-950/20 px-6 py-12 text-center text-sm text-zinc-500">
          이미지가 없는 게시물입니다.
        </div>
      )}

      <div className="space-y-3 px-4 py-3">
        <BongstagramPostInteractions
          postId={post.id}
          initialLikeCount={post.like_count}
          initialCommentCount={post.comment_count}
          initialLiked={post.liked_by_viewer}
          likeMode={likeMode}
          caption={post.content ? <PostCaption post={post} /> : null}
        />
        <p className="text-[11px] text-zinc-500">{formatPostTime(post.posted_at)}</p>
      </div>
    </article>
  )
}

export default function BongstagramInfiniteFeed({
  initialPosts,
  initialCursor,
  initialHasMore,
  likeMode,
}: {
  initialPosts: BongstagramFeedPost[]
  initialCursor: BongstagramPostCursor | null
  initialHasMore: boolean
  likeMode: BongstagramLikeMode
}) {
  const [posts, setPosts] = useState(initialPosts)
  const [cursor, setCursor] = useState(initialCursor)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadError, setLoadError] = useState('')
  const [isPending, startTransition] = useTransition()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || !hasMore || !cursor || loadingRef.current) return
      loadingRef.current = true
      startTransition(async () => {
        try {
          const result: BongstagramFeedPageResult = await getBongstagramFeedPage(cursor)
          setPosts((current) => [...current, ...result.posts])
          setCursor(result.nextCursor)
          setHasMore(result.hasMore)
          setLoadError('')
        } catch {
          setLoadError('게시물을 불러오지 못했습니다.')
        } finally {
          loadingRef.current = false
        }
      })
    }, { rootMargin: '720px 0px' })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [cursor, hasMore, startTransition])

  const postIds = posts.map((post) => post.id)
  const initialLikeCounts = Object.fromEntries(posts.map((post) => [post.id, post.like_count ?? 0]))
  const items = posts.map((post) => ({ characterId: post.character_id, element: <FeedPostCard key={post.id} post={post} likeMode={likeMode} /> }))

  return (
    <>
      <BongstagramLikeCountProvider postIds={postIds} initialLikeCounts={initialLikeCounts} initialLikedPostIds={posts.filter((post) => post.liked_by_viewer).map((post) => post.id)} likeMode={likeMode}>
        <BongstagramFeedOrder items={items} />
      </BongstagramLikeCountProvider>
      <div ref={sentinelRef} className="flex min-h-16 items-center justify-center py-5 text-xs text-zinc-600" aria-live="polite">
        {isPending ? '게시물을 불러오는 중…' : loadError || (hasMore ? '' : posts.length > 0 ? '모든 게시물을 불러왔습니다.' : '')}
      </div>
    </>
  )
}
