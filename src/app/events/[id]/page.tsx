export const revalidate = 300

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, Calendar, ExternalLink, Users } from 'lucide-react'
import type { Metadata } from 'next'
import ReactMarkdown from 'react-markdown'
import { typeLabel, typeColor } from '@/lib/events'
import { StreamerBlur, StreamerReveal } from '@/components/ui/StreamerMask'
import ClipLabel from '@/components/events/ClipLabel'
import AppImage from '@/components/ui/AppImage'

type Props = { params: Promise<{ id: string }> }

type EventDetail = {
  id: string
  title: string
  summary: string | null
  content: string | null
  type: string | null
  thumbnail_url: string | null
  occurred_at: string | null
  event_participants: Array<{
    role: string | null
    characters: {
      id: string
      name: string
      alias: string[] | null
      job: string | null
      status: string
      streamers: { id: string; display_name: string } | null
    } | null
  }>
  event_clips: Array<{
    id: string
    clip_url: string
    label: string | null
    sort_order: number
    streamers: { id: string; display_name: string } | null
  }>
}

const statusColor: Record<string, string> = {
  active: 'text-green-400',
  dead: 'text-red-400',
  retired: 'text-zinc-400',
  hiatus: 'text-yellow-400',
}

async function getEvent(id: string): Promise<EventDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select(`
      id, title, summary, content, type, thumbnail_url, occurred_at,
      event_participants (
        role,
        characters (
          id, name, alias, job, status,
          streamers ( id, display_name )
        )
      ),
      event_clips (
        id, clip_url, label, sort_order,
        streamers ( id, display_name )
      )
    `)
    .eq('id', id)
    .eq('is_published', true)
    .single()

  return data as unknown as EventDetail | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) return {}
  return {
    title: event.title,
    description: event.summary ?? '봉누도2 사건 아카이브',
    openGraph: {
      title: event.title,
      description: event.summary ?? '봉누도2 사건 아카이브',
      ...(event.thumbnail_url ? { images: [event.thumbnail_url] } : {}),
    },
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) notFound()

  const clips = [...(event.event_clips ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  // 스트리머 ID → 캐릭터명 맵 (클립 시점 표시용)
  const streamerToChar: Record<string, string> = {}
  // 스트리머 display_name → 캐릭터명 맵 (클립 라벨 텍스트 치환용)
  const streamerNameToChar: Record<string, string> = {}
  for (const p of event.event_participants ?? []) {
    const c = p.characters
    if (c?.streamers?.id) streamerToChar[c.streamers.id] = c.name
    if (c?.streamers?.display_name) streamerNameToChar[c.streamers.display_name] = c.name
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      {/* 뒤로가기 */}
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ChevronLeft size={16} />
        사건 아카이브
      </Link>

      {/* 헤더 */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {event.type && (
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColor[event.type]}`}>
              {typeLabel[event.type]}
            </span>
          )}
          {event.occurred_at && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Calendar size={11} />
              {new Date(event.occurred_at).toLocaleString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: false,
              })}
            </span>
          )}
        </div>

        <h1 className="text-3xl font-black text-white leading-snug">{event.title}</h1>

        {event.summary && (
          <p className="text-base text-zinc-400 leading-relaxed border-l-2 border-amber-400/50 pl-4">
            {event.summary}
          </p>
        )}
      </div>

      {/* 썸네일 */}
      {event.thumbnail_url && (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <AppImage src={event.thumbnail_url} alt={event.title} className="w-full object-cover max-h-80" />
        </div>
      )}

      {/* 본문 */}
      {event.content && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="prose prose-invert prose-sm max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-p:text-zinc-400 prose-p:leading-relaxed
            prose-strong:text-zinc-200
            prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline
            prose-hr:border-zinc-800
            prose-blockquote:border-l-amber-400/50 prose-blockquote:text-zinc-400
            prose-code:text-amber-300 prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded
            prose-li:text-zinc-400
          ">
            <ReactMarkdown>{event.content}</ReactMarkdown>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* 참여 캐릭터 */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <Users size={16} className="text-zinc-500" />
            참여 인물
            <span className="text-sm font-normal text-zinc-500">
              ({event.event_participants?.length ?? 0}명)
            </span>
          </h2>

          {!event.event_participants?.length ? (
            <p className="text-sm text-zinc-600">등록된 참여 인물이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {event.event_participants.map((p, i) => {
                const c = p.characters
                if (!c) return null
                return (
                  <Link
                    key={i}
                    href={`/characters/${c.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-400">
                      {c.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors truncate">
                        {c.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.role && <span className="text-xs text-zinc-500">{p.role}</span>}
                        {c.streamers && (
                          <StreamerBlur>
                            <span className={`text-xs text-zinc-600 ${p.role ? 'before:content-["·"] before:mr-1.5' : ''}`}>
                              {c.streamers.display_name}
                            </span>
                          </StreamerBlur>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${statusColor[c.status]}`}>
                      {c.status === 'active' ? '●' : '○'}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* 관련 클립 */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <ExternalLink size={16} className="text-zinc-500" />
            관련 클립
            <span className="text-sm font-normal text-zinc-500">({clips.length}개)</span>
          </h2>

          {!clips.length ? (
            <p className="text-sm text-zinc-600">등록된 클립이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {clips.map((clip) => {
                const charName = clip.streamers?.id ? streamerToChar[clip.streamers.id] : null
                return (
                  <a
                    key={clip.id}
                    href={clip.clip_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition-colors hover:border-amber-400/30 hover:bg-zinc-800/50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                      <ExternalLink size={14} className="text-zinc-500 group-hover:text-amber-400 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 group-hover:text-amber-400 transition-colors truncate">
                        <ClipLabel label={clip.label ?? '클립 보기'} streamerToChar={streamerNameToChar} />
                      </p>
                      {clip.streamers && (
                        <p className="text-xs text-zinc-500">
                          {charName ? (
                            <StreamerReveal fallback={`${charName} 시점`}>
                              {clip.streamers.display_name} 시점
                            </StreamerReveal>
                          ) : (
                            <StreamerBlur>{clip.streamers.display_name} 시점</StreamerBlur>
                          )}
                        </p>
                      )}
                    </div>
                    <ExternalLink size={12} className="shrink-0 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                  </a>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
