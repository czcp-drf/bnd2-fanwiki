'use client'

import { Maximize2, Minimize2, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

const BBS_VIDEO_VOLUME_KEY = 'bbs-video-volume'
const BBS_VIDEO_VOLUME_EVENT = 'bbs-video-volume-change'

function formatTime(value: number) {
  if (!Number.isFinite(value)) return '0:00'
  const totalSeconds = Math.max(0, Math.floor(value))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export default function BbsVideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<HTMLSpanElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)
    const updatePlayback = () => setIsPlaying(!video.paused && !video.ended)
    const updateVolume = () => {
      setVolume(video.volume)
      setIsMuted(video.muted || video.volume === 0)
    }
    const updateFullscreen = () => setIsFullscreen(document.fullscreenElement === playerRef.current)
    const updateSharedVolume = (event: Event) => {
      const nextVolume = Number((event as CustomEvent<number>).detail)
      if (!Number.isFinite(nextVolume) || nextVolume < 0 || nextVolume > 1) return
      video.volume = nextVolume
      video.muted = nextVolume === 0
      setVolume(nextVolume)
      setIsMuted(nextVolume === 0)
    }

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('durationchange', updateDuration)
    video.addEventListener('play', updatePlayback)
    video.addEventListener('pause', updatePlayback)
    video.addEventListener('ended', updatePlayback)
    video.addEventListener('volumechange', updateVolume)
    document.addEventListener('fullscreenchange', updateFullscreen)
    window.addEventListener(BBS_VIDEO_VOLUME_EVENT, updateSharedVolume)
    try {
      const savedVolumeValue = window.localStorage.getItem(BBS_VIDEO_VOLUME_KEY)
      if (savedVolumeValue !== null) {
        const savedVolume = Number(savedVolumeValue)
        if (Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 1) {
          video.volume = savedVolume
          video.muted = savedVolume === 0
        }
      }
    } catch {
      // 저장소 접근이 제한된 환경에서는 기본 음량을 사용합니다.
    }
    updateDuration()
    updateVolume()

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('durationchange', updateDuration)
      video.removeEventListener('play', updatePlayback)
      video.removeEventListener('pause', updatePlayback)
      video.removeEventListener('ended', updatePlayback)
      video.removeEventListener('volumechange', updateVolume)
      document.removeEventListener('fullscreenchange', updateFullscreen)
      window.removeEventListener(BBS_VIDEO_VOLUME_EVENT, updateSharedVolume)
    }
  }, [])

  useEffect(() => {
    if (!isPlaying) setShowControls(true)
  }, [isPlaying])

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused || video.ended) void video.play()
    else video.pause()
  }

  function seek(value: number) {
    const video = videoRef.current
    if (!video) return
    video.currentTime = value
    setCurrentTime(value)
  }

  function changeVolume(value: number) {
    const video = videoRef.current
    if (!video) return
    video.volume = value
    video.muted = value === 0
    setVolume(value)
    setIsMuted(value === 0)
    try {
      window.localStorage.setItem(BBS_VIDEO_VOLUME_KEY, String(value))
    } catch {
      // 저장소 접근이 제한된 환경에서도 현재 영상의 음량은 변경합니다.
    }
    window.dispatchEvent(new CustomEvent(BBS_VIDEO_VOLUME_EVENT, { detail: value }))
  }

  function toggleMute() {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  async function toggleFullscreen() {
    const player = playerRef.current
    if (!player) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await player.requestFullscreen()
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <span ref={playerRef} onPointerEnter={() => setShowControls(true)} onPointerLeave={() => { if (isPlaying) setShowControls(false) }} className="my-3 block w-full overflow-hidden rounded-xl bg-black text-white shadow-[0_3px_12px_rgba(0,0,0,0.12)]">
      <span className="relative block aspect-video bg-black">
        <video ref={videoRef} src={src} preload="metadata" playsInline className="h-full w-full object-contain" aria-label="기사 첨부 영상" onClick={togglePlay} />
        {!isPlaying && <button type="button" onClick={togglePlay} aria-label="영상 재생" className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[#e14b32]/90 text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f08468] focus-visible:ring-offset-2 focus-visible:ring-offset-black active:ring-2 active:ring-[#f08468]"><Play size={24} fill="currentColor" className="ml-0.5" /></button>}
        <span className={`absolute inset-x-0 bottom-0 block bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pb-2.5 pt-8 transition-opacity duration-200 ${showControls ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
          <input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={(event) => seek(Number(event.target.value))} aria-label="영상 재생 위치" className="mb-1.5 h-1.5 w-full cursor-pointer accent-[#e14b32] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f08468]" style={{ '--bbs-video-progress': `${progress}%` } as CSSProperties} />
          <span className="flex items-center gap-2">
            <button type="button" onClick={togglePlay} aria-label={isPlaying ? '영상 일시정지' : '영상 재생'} className="cursor-pointer rounded-md p-1 text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f08468] active:ring-2 active:ring-[#f08468]">{isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" className="ml-0.5" />}</button>
            <button type="button" onClick={toggleMute} aria-label={isMuted ? '음량 켜기' : '음소거'} className="cursor-pointer rounded-md p-1 text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f08468] active:ring-2 active:ring-[#f08468]">{isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
            <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={(event) => changeVolume(Number(event.target.value))} aria-label="영상 음량" className="h-1 w-16 cursor-pointer accent-[#e14b32] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f08468] sm:w-20" />
            <span className="ml-1 text-[10px] tabular-nums text-white/80">{formatTime(currentTime)} / {formatTime(duration)}</span>
            <button type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? '전체화면 나가기' : '전체화면'} className="ml-auto cursor-pointer rounded-md p-1 text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f08468] active:ring-2 active:ring-[#f08468]">{isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
          </span>
        </span>
      </span>
    </span>
  )
}
