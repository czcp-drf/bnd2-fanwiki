'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ExternalLink, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRedPill } from '@/lib/context/RedPillContext'
import ClipLabel from './ClipLabel'

type Clip = {
  id: string
  clip_url: string
  label: string | null
  sort_order: number
  streamers: { id: string; display_name: string } | null
}

function parseClipUrl(url: string): string | null {
  // Chzzk: https://chzzk.naver.com/clips/5UJ2F0U94w
  const chzzkMatch = url.match(/chzzk\.naver\.com\/clips\/([a-zA-Z0-9_-]+)/)
  if (chzzkMatch) return `https://chzzk.naver.com/embed/clip/${chzzkMatch[1]}`

  // YouTube: watch?v=, youtu.be/, shorts/
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?enablejsapi=1`

  return null
}

export default function ClipPlayer({
  clips,
  streamerToChar,
  streamerNameToChar,
}: {
  clips: Clip[]
  streamerToChar: Record<string, string>
  streamerNameToChar: Record<string, string>
}) {
  const [activeId, setActiveId] = useState<string>(clips[0]?.id ?? '')
  const [reloadTokens, setReloadTokens] = useState<Record<string, number>>({})
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)
  const [tooltip, setTooltip] = useState<{ label: string; streamerLine: string | null } | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const { isRedPill } = useRedPill()

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 0)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    updateScrollState()
  }, [updateScrollState])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth : el.clientWidth, behavior: 'smooth' })
  }

  function selectClip(id: string) {
    if (id === activeId) return

    // YouTube는 명령을 지원하고, 다른 임베드 플레이어는 iframe을 재생성해
    // 이전 클립의 재생을 확실하게 중지한다.
    const previousIframe = iframeRefs.current[activeId]
    previousIframe?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
      '*',
    )
    setReloadTokens((current) => ({
      ...current,
      [activeId]: (current[activeId] ?? 0) + 1,
    }))
    setActiveId(id)
  }

  if (!clips.length) return null

  const active = clips.find((c) => c.id === activeId) ?? clips[0]
  const activeCharName = active.streamers?.id ? streamerToChar[active.streamers.id] : null
  const activePerspective = active.streamers
    ? (isRedPill ? active.streamers.display_name : activeCharName ?? active.streamers.display_name)
    : null

  return (
    <div className="flex flex-col gap-4">
      {/* 플레이어 */}
      <div className="w-full space-y-0 rounded-xl border border-zinc-800 overflow-hidden">
        {/* 영상 영역 — 모든 iframe을 미리 로드하고 활성 클립만 표시 */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          {clips.map((clip) => {
            const url = parseClipUrl(clip.clip_url)
            const isActive = clip.id === activeId
            if (!url) {
              return isActive ? (
                <a
                  key={clip.id}
                  href={clip.clip_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900 text-zinc-500 hover:text-amber-400 transition-colors"
                >
                  <ExternalLink size={28} />
                  <span className="text-sm">외부 링크로 보기</span>
                </a>
              ) : null
            }
            return (
              <iframe
                key={`${clip.id}-${reloadTokens[clip.id] ?? 0}`}
                ref={(element) => { iframeRefs.current[clip.id] = element }}
                src={url}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                loading="eager"
                title={clip.label ?? `클립 ${clips.indexOf(clip) + 1}`}
                style={{ border: 'none', visibility: isActive ? 'visible' : 'hidden' }}
              />
            )
          })}
        </div>

        {/* 클립 정보 바 */}
        <div className="flex items-center gap-3 bg-zinc-900 border-t border-zinc-800 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">
              <ClipLabel
                label={active.label ?? '클립'}
                streamerToChar={streamerNameToChar}
              />
            </p>
            <p className="text-xs text-zinc-500 mt-0.5 truncate">
              {activePerspective ? `${activePerspective} 시점` : '\u00A0'}
            </p>
          </div>
          <a
            href={active.clip_url}
            target="_blank"
            rel="noopener noreferrer"
            title="원본 링크"
            className="shrink-0 rounded-lg border border-zinc-700 p-1.5 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* 플레이리스트 (2개 이상일 때만) */}
      {clips.length > 1 && (
        <div className="relative">
          <button
            onClick={() => scroll('left')}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all shadow-lg ${canLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all shadow-lg ${canRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <ChevronRight size={16} />
          </button>
          <div
            ref={scrollRef}
            onScroll={updateScrollState}
            className="flex gap-2 overflow-x-scroll"
            style={{ scrollbarWidth: 'none' }}
          >
            {clips.map((clip, i) => {
              const isActive = clip.id === activeId
              const charName = clip.streamers?.id ? streamerToChar[clip.streamers.id] : null
              const streamerLine = clip.streamers
                ? `${isRedPill ? clip.streamers.display_name : charName ?? clip.streamers.display_name} 시점`
                : null
              return (
                <button
                  key={clip.id}
                  onClick={() => selectClip(clip.id)}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top })
                    setTooltip({ label: clip.label ?? `클립 ${i + 1}`, streamerLine })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  className={`flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer w-52 ${
                    isActive
                      ? 'border-amber-400/40 bg-amber-400/5'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/50'
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isActive
                        ? 'bg-amber-400 text-zinc-900'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {isActive ? <Play size={11} fill="currentColor" /> : i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium truncate ${isActive ? 'text-amber-400' : 'text-zinc-300'}`}>
                      <ClipLabel label={clip.label ?? `클립 ${i + 1}`} streamerToChar={streamerNameToChar} />
                    </p>
                    {clip.streamers && (
                      <p className="text-[11px] text-zinc-500 truncate">{streamerLine}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* fixed 툴팁 — overflow 클리핑 우회 */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50"
          style={{ left: tooltipPos.x, top: tooltipPos.y, transform: 'translate(-50%, calc(-100% - 10px))' }}
        >
          <div className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 shadow-xl w-max max-w-64 text-left">
            <p className="text-xs font-medium text-zinc-200">
              <ClipLabel label={tooltip.label} streamerToChar={streamerNameToChar} />
            </p>
            {tooltip.streamerLine && (
              <p className="text-[11px] text-zinc-500 mt-0.5">{tooltip.streamerLine}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
