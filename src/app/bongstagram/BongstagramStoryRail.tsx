'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { ChevronLeft, ChevronRight, Plus, Volume2, VolumeX, X } from 'lucide-react'
import AppImage from '@/components/ui/AppImage'
import BongstagramDisplayName from './BongstagramDisplayName'
import BongstagramProfileAvatar from './BongstagramProfileAvatar'
import {
  getBongstagramMuted,
  getServerBongstagramMuted,
  subscribeBongstagramMute,
  toggleBongstagramMute,
} from './BongstagramVideoPlayer'

type StoryMedia = {
  id: string
  media_type: 'image' | 'video'
  media_url: string
  sort_order: number
}

type StorySlide = {
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
}

const previewStories = [
  { label: '명총회', mark: '명', tone: 'from-amber-300 via-pink-500 to-fuchsia-600' },
  { label: 'zzya', mark: 'Z', tone: 'from-orange-300 via-fuchsia-500 to-violet-600' },
  { label: '김청순', mark: '김', tone: 'from-fuchsia-400 via-violet-500 to-sky-500' },
  { label: '차수진', mark: '차', tone: 'from-pink-400 via-red-400 to-orange-300' },
]

function formatStoryTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
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

function StoryViewer({ slides, activeIndex, onClose, onChange }: {
  slides: StorySlide[]
  activeIndex: number
  onClose: () => void
  onChange: (index: number) => void
}) {
  const [progress, setProgress] = useState(0)
  const [isPendingVideo, setIsPendingVideo] = useState(false)
  const pointerStart = useRef<number | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const muted = useSyncExternalStore(subscribeBongstagramMute, getBongstagramMuted, getServerBongstagramMuted)
  const active = slides[activeIndex]

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') onChange(Math.max(0, activeIndex - 1))
      if (event.key === 'ArrowRight') onChange(Math.min(slides.length - 1, activeIndex + 1))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeIndex, onChange, onClose, slides.length])

  useEffect(() => {
    if (active.media?.media_type === 'video') return

    const startedAt = Date.now()
    const duration = 5000
    const interval = window.setInterval(() => {
      const nextProgress = Math.min(1, (Date.now() - startedAt) / duration)
      setProgress(nextProgress)
      if (nextProgress >= 1) {
        window.clearInterval(interval)
        if (activeIndex < slides.length - 1) onChange(activeIndex + 1)
        else onClose()
      }
    }, 50)
    return () => window.clearInterval(interval)
  }, [active, activeIndex, onChange, onClose, slides.length])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = muted
    void video.play().catch(() => setIsPendingVideo(false))
  }, [activeIndex, muted])

  function previous() {
    if (activeIndex > 0) onChange(activeIndex - 1)
  }

  function next() {
    if (activeIndex < slides.length - 1) onChange(activeIndex + 1)
    else onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-0 sm:p-4" role="presentation">
      <section
        className="relative flex h-dvh w-full max-w-[540px] flex-col overflow-hidden bg-black sm:h-[min(900px,calc(100dvh-2rem))] sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="스토리 보기"
        onPointerDown={(event) => { pointerStart.current = event.clientX }}
        onPointerUp={(event) => {
          if (pointerStart.current === null) return
          const distance = event.clientX - pointerStart.current
          pointerStart.current = null
          if (Math.abs(distance) >= 20) {
            if (distance > 0) previous()
            else next()
          }
        }}
      >
        <div className="absolute inset-x-3 top-3 z-10 flex gap-1">
          {slides.map((slide, index) => (
            <div key={slide.media?.id ?? slide.story.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div className="h-full origin-left rounded-full bg-white" style={{ width: index < activeIndex ? '100%' : index === activeIndex ? `${progress * 100}%` : '0%' }} />
            </div>
          ))}
        </div>

        <header className="absolute inset-x-0 top-6 z-10 flex items-center justify-between px-4 pt-2 !text-white">
          <div className="flex min-w-0 items-center gap-2.5">
            <BongstagramProfileAvatar
              profileAvatarUrl={active.story.profile_avatar_url}
              streamerAvatarUrl={active.story.streamer_avatar_url}
              fallbackAvatarUrl={active.story.character_avatar_url}
              profileName={active.story.profile_name}
              streamerName={active.story.streamer_name}
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold !text-white"><BongstagramDisplayName profileName={active.story.profile_name} streamerName={active.story.streamer_name} /></p>
              <time className="block text-[10px] !text-white/60" dateTime={active.story.posted_at}>{formatStoryTime(active.story.posted_at)}</time>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {active.media?.media_type === 'video' && (
              <button type="button" aria-label={muted ? '스토리 소리 켜기' : '스토리 음소거'} onClick={(event) => { event.stopPropagation(); toggleBongstagramMute() }} className="!text-white transition-opacity hover:opacity-70">
                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            )}
            <button type="button" aria-label="스토리 닫기" onClick={(event) => { event.stopPropagation(); onClose() }} className="!text-white transition-opacity hover:opacity-70"><X size={23} /></button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 items-center justify-center px-5 py-16">
          {active.media?.media_type === 'video' ? (
            <video
              key={active.media.id}
              ref={videoRef}
              data-bongstagram-story-video
              src={active.media.media_url}
              autoPlay
              muted={muted}
              playsInline
              preload="auto"
              className="max-h-full max-w-full object-contain"
              aria-label="스토리 동영상"
              onLoadedMetadata={(event) => { setIsPendingVideo(false); event.currentTarget.muted = muted; void event.currentTarget.play().catch(() => {}) }}
              onTimeUpdate={(event) => { const video = event.currentTarget; if (video.duration) setProgress(video.currentTime / video.duration) }}
              onEnded={next}
            />
          ) : active.media?.media_type === 'image' ? (
            <AppImage src={active.media.media_url} alt="스토리 이미지" width={540} height={960} className="max-h-full w-auto max-w-full object-contain" />
          ) : (
            <p className="max-w-[28rem] whitespace-pre-wrap break-words px-6 text-center text-lg leading-8 text-white">{active.story.content || '내용이 없는 스토리입니다.'}</p>
          )}
          {isPendingVideo && <span className="sr-only">동영상 불러오는 중</span>}
        </div>

        <button type="button" aria-label="이전 스토리" onClick={(event) => { event.stopPropagation(); previous() }} disabled={activeIndex === 0} className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-zinc-800 transition-opacity hover:bg-white disabled:opacity-0"><ChevronLeft size={24} /></button>
        <button type="button" aria-label="다음 스토리" onClick={(event) => { event.stopPropagation(); next() }} className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-zinc-800 transition-opacity hover:bg-white"><ChevronRight size={24} /></button>
      </section>
    </div>
  )
}

export default function BongstagramStoryRail({ stories }: { stories: BongstagramStory[] }) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const slides = useMemo<StorySlide[]>(() => {
    const nextSlides: StorySlide[] = []
    for (const story of stories) {
      if (story.media.length > 0) {
        for (const media of story.media) nextSlides.push({ story, media })
      } else {
        nextSlides.push({ story, media: null })
      }
    }
    return nextSlides
  }, [stories])
  const startIndexByStoryId = useMemo(() => new Map(stories.map((story) => [story.id, slides.findIndex((slide) => slide.story.id === story.id)])), [slides, stories])

  return (
    <>
      <section className="flex gap-3 overflow-x-auto border-b border-zinc-800 px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="스토리">
        <div className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5">
          <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-zinc-800 text-xl font-bold text-zinc-200">
            <span>봉</span>
            <span className="bongstagram-story-add absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full"><Plus size={12} strokeWidth={3} /></span>
          </div>
          <span className="max-w-[4.5rem] truncate text-[11px] text-zinc-400">내 스토리</span>
        </div>
        {stories.length > 0 ? stories.map((story) => {
          const firstMedia = story.media[0]
          const startIndex = startIndexByStoryId.get(story.id) ?? 0
          return (
            <button key={story.id} type="button" onClick={() => { setActiveIndex(startIndex); setOpen(true) }} className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5 text-left">
              <StoryAvatar story={story} mark={story.profile_name.slice(0, 1)} />
              <span className="max-w-[4.5rem] truncate text-[11px] text-zinc-400"><BongstagramDisplayName profileName={story.profile_name} streamerName={story.streamer_name} /></span>
              {firstMedia && <span className="sr-only">미디어 {story.media.length}개</span>}
            </button>
          )
        }) : previewStories.map((story) => (
          <div key={story.label} className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5">
            <div className={`rounded-full bg-gradient-to-tr ${story.tone} p-[2px]`}><div className="bongstagram-story-avatar flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border-2 border-zinc-950 text-xl font-bold text-zinc-200">{story.mark}</div></div>
            <span className="max-w-[4.5rem] truncate text-[11px] text-zinc-400">{story.label}</span>
          </div>
        ))}
      </section>
      {open && slides.length > 0 && <StoryViewer key={activeIndex} slides={slides} activeIndex={activeIndex} onClose={() => setOpen(false)} onChange={setActiveIndex} />}
    </>
  )
}
