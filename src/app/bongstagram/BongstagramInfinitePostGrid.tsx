'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { ImageIcon, Play } from 'lucide-react'
import AppImage from '@/components/ui/AppImage'
import {
  getBongstagramHashtagGridPage,
  getBongstagramPostGridPage,
  type BongstagramHashtagGridPageResult,
  type BongstagramPostGridPageResult,
} from './actions'
import type { BongstagramPostCursor } from '@/lib/bongstagram/types'

type GridPost = {
  id: string
  character_id: string
  media_type: 'image' | 'video' | null
  media_url: string | null
}

export default function BongstagramInfinitePostGrid({
  initialPosts,
  initialCursor,
  initialHasMore,
  hashtag,
}: {
  initialPosts: GridPost[]
  initialCursor: BongstagramPostCursor | null
  initialHasMore: boolean
  hashtag?: string
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
          const result: BongstagramPostGridPageResult | BongstagramHashtagGridPageResult = hashtag
            ? await getBongstagramHashtagGridPage(hashtag, cursor)
            : await getBongstagramPostGridPage(cursor)
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
  }, [cursor, hasMore, hashtag, startTransition])

  return (
    <>
      {posts.length > 0 ? (
        <div className="grid grid-cols-3 gap-px bg-zinc-900">
          {posts.map((post) => (
            <Link key={post.id} href={`/bongstagram/post/${post.id}`} aria-label="게시물 상세 보기" className="relative block aspect-square overflow-hidden bg-black">
              {post.media_type === 'video' && post.media_url ? <video muted playsInline preload="metadata" src={post.media_url} className="h-full w-full object-cover" aria-label="동영상 게시물" /> : post.media_type === 'image' && post.media_url ? <AppImage src={post.media_url} alt="게시물" width={180} height={180} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-zinc-900 text-zinc-600"><ImageIcon size={24} /></div>}
              {post.media_type === 'video' && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md bg-white text-zinc-950 shadow-sm"><Play size={14} fill="currentColor" strokeWidth={1.5} /></span>}
            </Link>
          ))}
        </div>
      ) : !hasMore ? (
        <p className="px-5 py-20 text-center text-sm text-zinc-600">등록된 게시물이 없습니다.</p>
      ) : null}
      <div ref={sentinelRef} className="flex min-h-16 items-center justify-center py-5 text-xs text-zinc-600" aria-live="polite">
        {isPending ? '게시물을 불러오는 중…' : loadError || (hasMore ? '' : posts.length > 0 ? '모든 게시물을 불러왔습니다.' : '')}
      </div>
    </>
  )
}
