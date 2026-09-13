'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Play, Volume2, VolumeX } from 'lucide-react'

let feedMuted = true
const muteListeners = new Set<() => void>()
export function subscribeBongstagramMute(listener: () => void) {
  muteListeners.add(listener)
  return () => { muteListeners.delete(listener) }
}
export function getBongstagramMuted() { return feedMuted }
export function getServerBongstagramMuted() { return true }

export function toggleBongstagramMute() {
  feedMuted = !feedMuted
  document.querySelectorAll<HTMLVideoElement>('video[data-bongstagram-video], video[data-bongstagram-story-video]').forEach((video) => {
    video.muted = feedMuted
  })
  muteListeners.forEach((listener) => listener())
}

export default function BongstagramVideoPlayer({ src, label }: { src: string; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const muted = useSyncExternalStore(subscribeBongstagramMute, getBongstagramMuted, getServerBongstagramMuted)

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [muted])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = getBongstagramMuted()

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio >= 0.5) {
        document.querySelectorAll<HTMLVideoElement>('video[data-bongstagram-video]').forEach((other) => {
          if (other !== video) other.pause()
        })
        void video.play().catch(() => setPlaying(false))
      } else {
        video.pause()
      }
    }, { threshold: [0, 0.5] })

    observer.observe(video)
    return () => { observer.disconnect(); video.pause() }
  }, [])

  function togglePlayback() {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
        document.querySelectorAll<HTMLVideoElement>('video[data-bongstagram-video]').forEach((other) => {
        if (other !== video) other.pause()
      })
      void video.play().catch(() => setPlaying(false))
    } else {
      video.pause()
    }
  }

  function toggleMute(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    toggleBongstagramMute()
  }

  return (
    <div className="group relative w-full cursor-pointer overflow-hidden bg-black" style={{ height: 'min(125vw, 675px)' }} onClick={togglePlayback}>
      <video
        ref={videoRef}
        data-bongstagram-video
        muted={muted}
        loop
        playsInline
        preload="metadata"
        src={src}
        className="h-full w-full object-contain"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
        aria-label={`${label} 동영상`}
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false)
        }}
      />

      {!playing && (
        <button type="button" onClick={(event) => { event.stopPropagation(); togglePlayback() }} aria-label="동영상 재생" className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center !text-white opacity-85 drop-shadow-lg transition-transform hover:scale-105">
          <Play size={104} fill="currentColor" strokeWidth={1.5} className="ml-1" />
        </button>
      )}

      <button type="button" onClick={toggleMute} aria-label={muted ? '동영상 소리 켜기' : '동영상 음소거'} className="absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 !text-white opacity-100 backdrop-blur-sm transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100">
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  )
}
