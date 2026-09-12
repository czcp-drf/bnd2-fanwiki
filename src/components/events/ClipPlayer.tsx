'use client'

import { useState } from 'react'
import { ExternalLink, Play } from 'lucide-react'
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
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`

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

  if (!clips.length) return null

  const active = clips.find((c) => c.id === activeId) ?? clips[0]
  const embedUrl = parseClipUrl(active.clip_url)
  const activeCharName = active.streamers?.id ? streamerToChar[active.streamers.id] : null

  return (
    <div className="flex flex-col gap-4">
      {/* 플레이어 */}
      <div className="w-full space-y-0 rounded-xl border border-zinc-800 overflow-hidden">
        {/* 영상 영역 */}
        {embedUrl ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              key={activeId}
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ border: 'none' }}
            />
          </div>
        ) : (
          <a
            href={active.clip_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-3 bg-zinc-900 py-20 text-zinc-500 hover:text-amber-400 transition-colors"
          >
            <ExternalLink size={28} />
            <span className="text-sm">외부 링크로 보기</span>
          </a>
        )}

        {/* 클립 정보 바 */}
        <div className="flex items-center gap-3 bg-zinc-900 border-t border-zinc-800 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">
              <ClipLabel
                label={active.label ?? '클립'}
                streamerToChar={streamerNameToChar}
              />
            </p>
            {active.streamers && (
              <p className="text-xs text-zinc-500 mt-0.5">
                {activeCharName
                  ? `${activeCharName} 시점`
                  : `${active.streamers.display_name} 시점`}
              </p>
            )}
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
        <div className="flex flex-row gap-2 overflow-x-auto pb-1">
          {clips.map((clip, i) => {
            const isActive = clip.id === activeId
            const charName = clip.streamers?.id ? streamerToChar[clip.streamers.id] : null
            return (
              <button
                key={clip.id}
                onClick={() => setActiveId(clip.id)}
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
                  <p
                    className={`text-xs font-medium truncate ${
                      isActive ? 'text-amber-400' : 'text-zinc-300'
                    }`}
                  >
                    <ClipLabel
                      label={clip.label ?? `클립 ${i + 1}`}
                      streamerToChar={streamerNameToChar}
                    />
                  </p>
                  {clip.streamers && (
                    <p className="text-[11px] text-zinc-500 truncate">
                      {charName
                        ? `${charName} 시점`
                        : `${clip.streamers.display_name} 시점`}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
