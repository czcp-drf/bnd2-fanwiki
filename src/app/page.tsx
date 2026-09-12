export const revalidate = 60

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, Building2, Map, FileText } from 'lucide-react'
import type { Event } from '@/types/database'
import StreamerListWithLive from '@/components/streamers/StreamerListWithLive'
import { getLiveStreamers } from '@/lib/data/live-streamers'
import AppImage from '@/components/ui/AppImage'
import LiveDataError from '@/components/live/LiveDataError'
import { LIVE_ENABLED } from '@/lib/live/config'

async function getStats() {
  const supabase = await createClient()
  const [{ count: streamerCount }, { count: characterCount }, { count: eventCount }] =
    await Promise.all([
      supabase.from('streamers').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('characters').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_published', true),
    ])
  return { streamerCount, characterCount, eventCount }
}


async function getRecentEvents() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .order('occurred_at', { ascending: false })
    .limit(6)
  return (data ?? []) as Event[]
}

const eventTypeLabel: Record<string, string> = {
  war: '전쟁',
  crime: '범죄',
  political: '정치',
  social: '사회',
  accident: '사고',
  other: '기타',
}

const eventTypeColor: Record<string, string> = {
  war: 'text-red-400 bg-red-400/10',
  crime: 'text-orange-400 bg-orange-400/10',
  political: 'text-blue-400 bg-blue-400/10',
  social: 'text-green-400 bg-green-400/10',
  accident: 'text-yellow-400 bg-yellow-400/10',
  other: 'text-zinc-400 bg-zinc-400/10',
}

const quickLinks = [
  { href: '/characters', icon: Users, label: '캐릭터 위키', desc: '등장인물 및 관계도' },
  { href: '/organizations', icon: Building2, label: '조직 정보', desc: '세력과 단체 목록' },
  { href: '/map', icon: Map, label: '거점 지도', desc: '조직 거점 및 주요 장소' },
  { href: '/report', icon: FileText, label: '제보하기', desc: '정보 제보 및 수정 요청' },
]

export default async function HomePage() {
  const [stats, streamers, events] = await Promise.all([
    getStats(),
    LIVE_ENABLED ? getLiveStreamers().catch(() => null) : Promise.resolve(null),
    getRecentEvents(),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-14">
      {/* 히어로 */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 px-8 py-14 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
        <div className="relative space-y-4">
          <div className="inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-400">
            봉누도2 팬페이지
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">
            봉누도<span className="text-amber-400">2</span> 위키
          </h1>
          <p className="mx-auto max-w-md text-zinc-400">
            스트리머, 캐릭터, 조직, 사건을 한 곳에서<br />봉누도2 서버의 모든 것
          </p>

          {/* 통계 */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-white">{stats.streamerCount ?? 0}</span>
              <span className="text-zinc-500">활동 스트리머</span>
            </div>
            <div className="h-10 w-px bg-zinc-700 self-center" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-white">{stats.characterCount ?? 0}</span>
              <span className="text-zinc-500">활동 캐릭터</span>
            </div>
            <div className="h-10 w-px bg-zinc-700 self-center" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-white">{stats.eventCount ?? 0}</span>
              <span className="text-zinc-500">기록된 사건</span>
            </div>
          </div>
        </div>
      </section>

      {/* 라이브 바로가기 */}
      {LIVE_ENABLED && <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-lg font-bold text-white">라이브 바로가기</h2>
          </div>
          <Link href="/live" className="text-sm text-zinc-500 hover:text-amber-400 transition-colors">
            전체 보기 →
          </Link>
        </div>

        {streamers === null ? <LiveDataError /> : streamers.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-12 text-center text-zinc-500 text-sm">
            등록된 스트리머가 없습니다.
          </div>
        ) : (
          <StreamerListWithLive streamers={streamers} onlineOnly />
        )}
      </section>}
      {/* 최근 사건 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">최근 사건</h2>
          <Link href="/events" className="text-sm text-zinc-500 hover:text-amber-400 transition-colors">
            전체 보기 →
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-12 text-center text-zinc-500 text-sm">
            기록된 사건이 없습니다.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="group flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-amber-400/40 hover:bg-zinc-800"
              >
                {e.thumbnail_url && (
                  <AppImage
                    src={e.thumbnail_url}
                    alt={e.title}
                    className="w-full h-32 rounded-lg object-cover"
                  />
                )}
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${eventTypeColor[e.type ?? 'other']}`}>
                    {eventTypeLabel[e.type ?? 'other']}
                  </span>
                  {e.occurred_at && (
                    <span className="text-xs text-zinc-500">
                      {new Date(e.occurred_at).toLocaleDateString('ko-KR')}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                  {e.title}
                </p>
                {e.summary && (
                  <p className="text-xs text-zinc-500 line-clamp-2">{e.summary}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 빠른 접근 */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">바로가기</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickLinks.map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-amber-400/40 hover:bg-zinc-800"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 group-hover:bg-amber-400/20 transition-colors">
                <Icon size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
