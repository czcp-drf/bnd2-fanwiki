'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from 'react'
import Link from 'next/link'
import { Heart, Plus, Send, Volume2, VolumeX, X } from 'lucide-react'
import AppImage from '@/components/ui/AppImage'
import { toggleBongstagramStoryLike } from './actions'
import type { BongstagramLikeMode } from '@/lib/bongstagram/like-mode'
import BongstagramDisplayName from './BongstagramDisplayName'
import BongstagramProfileAvatar from './BongstagramProfileAvatar'
import {
  getBongstagramMuted,
  getServerBongstagramMuted,
  subscribeBongstagramMute,
  toggleBongstagramMute,
} from './BongstagramVideoPlayer'
import { BONGSTAGRAM_FOLLOWING_EVENT, readBongstagramFollowingSnapshot } from '@/lib/bongstagram/following'

const STORY_LIKES_STORAGE_KEY = 'bongstagram-story-likes'

function readStoredStoryLikes() {
  if (typeof window === 'undefined') return new Set<string>()
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORY_LIKES_STORAGE_KEY) ?? '[]')
    return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

function writeStoredStoryLikes(likedIds: Set<string>) {
  window.localStorage.setItem(STORY_LIKES_STORAGE_KEY, JSON.stringify(Array.from(likedIds)))
}

export type StoryMedia = {
  id: string
  media_type: 'image' | 'video'
  media_url: string
  sort_order: number
}

export type StorySlide = {
  story: BongstagramStory
  media: StoryMedia | null
}

export type BongstagramStory = {
  id: string
  character_id: string
  content: string
  posted_at: string
  media: StoryMedia[]
  profile_name: string
  profile_avatar_url: string | null
  character_avatar_url: string | null
  streamer_name: string | null
  streamer_avatar_url: string | null
  liked_by_viewer?: boolean
}

function subscribeBongstagramFollowing(callback: () => void) {
  window.addEventListener(BONGSTAGRAM_FOLLOWING_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(BONGSTAGRAM_FOLLOWING_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

function getServerFollowingSnapshot() {
  return '[]'
}

function formatStoryTime(value: string) {
  const date = new Date(value)
  const elapsed = Math.max(0, Date.now() - date.getTime())
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (elapsed < minute) return '방금'
  if (elapsed < hour) return `${Math.floor(elapsed / minute)}분`
  if (elapsed >= day) {
    const parts = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' }).formatToParts(date)
    return `${parts.find((part) => part.type === 'month')?.value}월 ${parts.find((part) => part.type === 'day')?.value}일`
  }
  return `${Math.floor(elapsed / hour)}시간`
}

function StoryAvatar({ story, mark }: { story: BongstagramStory; mark: string }) {
  return (
    <div className="relative rounded-full bg-gradient-to-tr from-amber-300 via-pink-500 to-fuchsia-600 p-[2px]">
      <div className="bongstagram-story-avatar relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border-2 border-zinc-950 text-xl font-bold text-zinc-200">
        <BongstagramProfileAvatar
          profileAvatarUrl={story.profile_avatar_url ?? story.character_avatar_url}
          streamerAvatarUrl={story.streamer_avatar_url}
          profileName={story.profile_name}
          streamerName={story.streamer_name}
          fallbackText={mark}
          className="h-full w-full rounded-full object-cover"
        />
      </div>
    </div>
  )
}

export function StoryViewer({ slideGroups, activeGroupIndex, activeSlideIndex, onClose, onChange, likeMode }: {
  slideGroups: StorySlide[][]
  activeGroupIndex: number
  activeSlideIndex: number
  onClose: () => void
  onChange: (groupIndex: number, slideIndex: number) => void
  likeMode: BongstagramLikeMode
}) {
  const activeGroup = slideGroups[activeGroupIndex] ?? []
  const active = activeGroup[activeSlideIndex] ?? activeGroup[0]
  const [progress, setProgress] = useState(0)
  const [isPendingVideo, setIsPendingVideo] = useState(false)
  const [storyLiked, setStoryLiked] = useState(() => likeMode === 'local' ? readStoredStoryLikes().has(active.story.id) : (active.story.liked_by_viewer ?? false))
  const [storyLikeError, setStoryLikeError] = useState('')
  const [isLikePending, startLikeTransition] = useTransition()
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const suppressClick = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const muted = useSyncExternalStore(subscribeBongstagramMute, getBongstagramMuted, getServerBongstagramMuted)

  const previous = useCallback(() => {
    if (activeSlideIndex > 0) {
      onChange(activeGroupIndex, activeSlideIndex - 1)
    } else if (activeGroupIndex > 0) {
      onChange(activeGroupIndex - 1, (slideGroups[activeGroupIndex - 1]?.length ?? 1) - 1)
    }
  }, [activeGroupIndex, activeSlideIndex, onChange, slideGroups])

  const next = useCallback(() => {
    if (activeSlideIndex < activeGroup.length - 1) {
      onChange(activeGroupIndex, activeSlideIndex + 1)
    } else if (activeGroupIndex < slideGroups.length - 1) {
      onChange(activeGroupIndex + 1, 0)
    } else {
      onClose()
    }
  }, [activeGroup.length, activeGroupIndex, activeSlideIndex, onChange, onClose, slideGroups.length])

  function handleStoryLike() {
    if (isLikePending) return
    setStoryLikeError('')
    if (likeMode === 'local') {
      const liked = !storyLiked
      setStoryLiked(liked)
      const storedLikes = readStoredStoryLikes()
      if (liked) storedLikes.add(active.story.id)
      else storedLikes.delete(active.story.id)
      writeStoredStoryLikes(storedLikes)
      return
    }
    startLikeTransition(async () => {
      const result = await toggleBongstagramStoryLike(active.story.id)
      if (result.error) {
        setStoryLikeError(result.error)
        return
      }

      const liked = result.liked ?? !storyLiked
      setStoryLiked(liked)
      const storedLikes = readStoredStoryLikes()
      if (liked) storedLikes.add(active.story.id)
      else storedLikes.delete(active.story.id)
      writeStoredStoryLikes(storedLikes)
    })
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProgress(0)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [activeGroupIndex, activeSlideIndex])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') previous()
      if (event.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeGroupIndex, activeSlideIndex, next, onClose, previous, slideGroups.length])

  useEffect(() => {
    const startedAt = Date.now()
    const duration = 5000
    const interval = window.setInterval(() => {
      const nextProgress = Math.min(1, (Date.now() - startedAt) / duration)
      setProgress(nextProgress)
      if (nextProgress >= 1) {
        window.clearInterval(interval)
        next()
      }
    }, 50)
    return () => window.clearInterval(interval)
  }, [active, activeGroupIndex, activeSlideIndex, next, activeGroup.length])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = muted
    void video.play().catch(() => setIsPendingVideo(false))
  }, [activeSlideIndex, muted])

  return (
    <div className="bongstagram-story-backdrop fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section
        className="relative flex h-dvh w-full max-w-[540px] select-none flex-col overflow-hidden bg-black sm:h-[min(900px,calc(100dvh-2rem))] sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="스토리 보기"
        onPointerDown={(event) => {
          suppressClick.current = false
          if (event.target instanceof Element && event.target.closest('a, button, input')) return
          pointerStart.current = { x: event.clientX, y: event.clientY }
        }}
        onPointerUp={(event) => {
          if (pointerStart.current === null) return
          const distance = event.clientX - pointerStart.current.x
          pointerStart.current = null
          if (Math.abs(distance) >= 20) {
            suppressClick.current = true
            if (distance > 0) previous()
            else next()
          }
        }}
        onPointerCancel={() => { pointerStart.current = null; suppressClick.current = false }}
        onClick={(event) => {
          if (suppressClick.current) {
            suppressClick.current = false
            return
          }
          if (event.target instanceof Element && event.target.closest('a, button, input')) return
          const bounds = event.currentTarget.getBoundingClientRect()
          if (event.clientX - bounds.left < bounds.width / 2) previous()
          else next()
        }}
      >
        <div className="absolute inset-x-3 top-3 z-30 flex gap-1">
          {activeGroup.map((slide, index) => (
            <div key={slide.media?.id ?? slide.story.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              <div className="h-full origin-left rounded-full bg-white" style={{ width: index < activeSlideIndex ? '100%' : index === activeSlideIndex ? `${progress * 100}%` : '0%' }} />
            </div>
          ))}
        </div>

        <header className="absolute inset-x-0 top-6 z-30 flex items-center justify-between px-4 pt-2 !text-white">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link href={`/bongstagram/${active.story.character_id}`} onPointerDown={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} className="flex min-w-0 items-center gap-2.5" aria-label="스토리 작성자 프로필 보기">
              <BongstagramProfileAvatar
                profileAvatarUrl={active.story.profile_avatar_url}
                streamerAvatarUrl={active.story.streamer_avatar_url}
                fallbackAvatarUrl={active.story.character_avatar_url}
                profileName={active.story.profile_name}
                streamerName={active.story.streamer_name}
                className="h-8 w-8 rounded-full object-cover"
              />
              <p className="truncate text-sm font-semibold !text-white"><BongstagramDisplayName profileName={active.story.profile_name} streamerName={active.story.streamer_name} /></p>
            </Link>
            <time className="shrink-0 text-xs !text-white/60" dateTime={active.story.posted_at}>{formatStoryTime(active.story.posted_at)}</time>
          </div>
          <div className="flex items-center gap-3">
            {active.media?.media_type === 'video' && (
              <button type="button" aria-label={muted ? '스토리 소리 켜기' : '스토리 음소거'} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); toggleBongstagramMute() }} className="!text-white transition-opacity hover:opacity-70">
                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            )}
            <button type="button" aria-label="스토리 닫기" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onClose() }} className="cursor-pointer !text-white transition-opacity hover:opacity-70"><X size={30} strokeWidth={2.5} /></button>
          </div>
        </header>

        <div className="absolute inset-0 z-0 bg-black/90" />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pb-3">
          <div className="relative min-h-0 w-full max-w-[calc(100vw-2rem)] flex-1 touch-pan-y overflow-hidden rounded-2xl bg-black">
            {active.media?.media_type === 'video' ? (
              <video
                key={active.media.id}
                ref={videoRef}
                data-bongstagram-story-video
                src={active.media.media_url}
                autoPlay
                muted={muted}
                playsInline
                loop
                preload="auto"
                className="h-full w-full object-contain"
                aria-label="스토리 동영상"
                onLoadedMetadata={(event) => { setIsPendingVideo(false); event.currentTarget.muted = muted; void event.currentTarget.play().catch(() => {}) }}
              />
            ) : active.media?.media_type === 'image' ? (
              <AppImage src={active.media.media_url} alt="스토리 이미지" fill sizes="(max-width: 540px) calc(100vw - 2rem), 540px" className="object-contain" />
            ) : (
              <p className="max-w-[28rem] whitespace-pre-wrap break-words px-6 text-center text-lg leading-8 text-white">{active.story.content || '내용이 없는 스토리입니다.'}</p>
            )}
            {isPendingVideo && <span className="sr-only">동영상 불러오는 중</span>}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-36 bg-gradient-to-b from-black/90 via-black/55 to-transparent" aria-hidden="true" />
          </div>
        </div>

        <div className="z-30 flex w-full shrink-0 flex-col gap-2">
          {storyLikeError && <p role="status" className="text-xs !text-rose-300">{storyLikeError}</p>}
          <div className="flex w-full items-center gap-4">
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} className="flex h-12 min-w-0 flex-1 items-center rounded-full border border-white/90 px-7 text-left text-sm !text-white/90 transition-colors hover:bg-white/10">메시지 보내기</button>
            <button type="button" aria-label={storyLiked ? '스토리 좋아요 취소' : '스토리 좋아요'} aria-pressed={storyLiked} disabled={isLikePending} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); handleStoryLike() }} className="shrink-0 cursor-pointer !text-white transition-transform hover:scale-110 disabled:cursor-wait disabled:opacity-60"><Heart size={31} strokeWidth={1.8} fill={storyLiked ? 'currentColor' : 'none'} /></button>
            <button type="button" aria-label="스토리 공유" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} className="shrink-0 cursor-pointer !text-white transition-transform hover:scale-110"><Send size={29} strokeWidth={1.8} /></button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function BongstagramStoryRail({ stories, likeMode }: { stories: BongstagramStory[]; likeMode: BongstagramLikeMode }) {
  const [open, setOpen] = useState(false)
  const [activeGroupIndex, setActiveGroupIndex] = useState(0)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const railRef = useRef<HTMLElement>(null)
  const pointerStart = useRef<{ x: number; scrollLeft: number } | null>(null)
  const suppressStoryClick = useRef(false)
  const followingSnapshot = useSyncExternalStore(subscribeBongstagramFollowing, readBongstagramFollowingSnapshot, getServerFollowingSnapshot)
  const followingIds = useMemo(() => {
    try {
      const value: unknown = JSON.parse(followingSnapshot)
      return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
    } catch {
      return []
    }
  }, [followingSnapshot])
  const followedStories = useMemo(() => {
    const followingSet = new Set(followingIds)
    return stories.filter((story) => followingSet.has(story.character_id))
  }, [followingIds, stories])
  const storyGroups = useMemo(() => {
    const groups = new Map<string, BongstagramStory[]>()
    followedStories.forEach((story) => groups.set(story.character_id, [...(groups.get(story.character_id) ?? []), story]))
    return Array.from(groups.values())
  }, [followedStories])
  const slideGroups = useMemo<StorySlide[][]>(() => storyGroups.map((group) => {
    const groupSlides: StorySlide[] = []
    group.forEach((story) => {
      if (story.media.length > 0) {
        story.media.forEach((media) => groupSlides.push({ story, media }))
      } else {
        groupSlides.push({ story, media: null })
      }
    })
    return groupSlides
  }), [storyGroups])
  const groupIndexByCharacterId = useMemo(() => new Map(storyGroups.map((group, index) => [group[0].character_id, index])), [storyGroups])

  function handleRailPointerDown(event: React.PointerEvent<HTMLElement>) {
    pointerStart.current = { x: event.clientX, scrollLeft: event.currentTarget.scrollLeft }
    suppressStoryClick.current = false
  }

  function handleRailPointerMove(event: React.PointerEvent<HTMLElement>) {
    const start = pointerStart.current
    if (!start) return
    const distance = event.clientX - start.x
    if (Math.abs(distance) > 4) {
      suppressStoryClick.current = true
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId)
    }
    event.currentTarget.scrollLeft = start.scrollLeft - distance
  }

  function handleRailPointerEnd(event: React.PointerEvent<HTMLElement>) {
    pointerStart.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return (
    <>
      <div className="relative">
        <section
          ref={railRef}
          className="flex cursor-grab select-none gap-3 overflow-x-auto border-b border-zinc-800 px-4 py-4 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-y"
          aria-label="스토리"
          onPointerDown={handleRailPointerDown}
          onPointerMove={handleRailPointerMove}
          onPointerUp={handleRailPointerEnd}
          onPointerCancel={handleRailPointerEnd}
        >
        <div className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5">
          <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-zinc-800 text-xl font-bold text-zinc-200">
            <span>봉</span>
            <span className="bongstagram-story-add absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full"><Plus size={12} strokeWidth={3} /></span>
          </div>
          <span className="max-w-[4.5rem] truncate text-[11px] text-zinc-400">내 스토리</span>
        </div>
        {storyGroups.map((group) => {
          const story = group[0]
          const groupIndex = groupIndexByCharacterId.get(story.character_id) ?? 0
          return (
            <button key={story.id} type="button" onClick={(event) => { if (suppressStoryClick.current) { event.preventDefault(); suppressStoryClick.current = false; return }; setActiveGroupIndex(groupIndex); setActiveSlideIndex(0); setOpen(true) }} className="flex w-[4.5rem] shrink-0 cursor-pointer flex-col items-center gap-1.5 text-left">
              <StoryAvatar story={story} mark={story.profile_name.slice(0, 1)} />
              <span className="max-w-[4.5rem] truncate text-[11px] text-zinc-400"><BongstagramDisplayName profileName={story.profile_name} streamerName={story.streamer_name} /></span>
              <span className="sr-only">스토리 {group.reduce((count, item) => count + Math.max(item.media.length, 1), 0)}개</span>
            </button>
          )
        })}
        </section>
      </div>
      {open && slideGroups.length > 0 && <StoryViewer key={`${activeGroupIndex}-${activeSlideIndex}`} slideGroups={slideGroups} activeGroupIndex={activeGroupIndex} activeSlideIndex={activeSlideIndex} onClose={() => setOpen(false)} onChange={(groupIndex, slideIndex) => { setActiveGroupIndex(groupIndex); setActiveSlideIndex(slideIndex) }} likeMode={likeMode} />}
    </>
  )
}
