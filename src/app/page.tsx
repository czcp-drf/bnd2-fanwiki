export const revalidate = 60

import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { WIKI_CACHE_REVALIDATE, WIKI_CACHE_TAGS, WIKI_PUBLIC_TAG } from '@/lib/cache/wiki'
import { Users, Building2, Map, FileText } from 'lucide-react'
import type { Event } from '@/types/database'
import StreamerListWithLive from '@/components/streamers/StreamerListWithLive'
import { getLiveStreamers } from '@/lib/data/live-streamers'
import AppImage from '@/components/ui/AppImage'
import LiveDataError from '@/components/live/LiveDataError'
import { LIVE_ENABLED } from '@/lib/live/config'
import { getPublishedBbsArticlesPage } from '@/lib/bbs/data'
import BongstagramDisplayName from '@/app/bongstagram/BongstagramDisplayName'
import { getBongstagramFeedPage } from '@/lib/bongstagram/feed-data'
import type { BongstagramFeedPost } from '@/lib/bongstagram/types'

async function getStats() {
  const supabase = createPublicClient()
  const [{ count: streamerCount }, { count: characterCount }, { count: eventCount }] =
    await Promise.all([
      supabase.from('streamers').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('characters').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_published', true),
    ])
  return { streamerCount, characterCount, eventCount }
}


async function getRecentEvents() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .order('occurred_at', { ascending: false })
    .limit(4)
  return (data ?? []) as Event[]
}

const getStatsCached = unstable_cache(getStats, ['wiki-home-stats'], {
  revalidate: WIKI_CACHE_REVALIDATE,
  tags: [WIKI_PUBLIC_TAG, WIKI_CACHE_TAGS.characters, WIKI_CACHE_TAGS.streamers, WIKI_CACHE_TAGS.events],
})
const getRecentEventsCached = unstable_cache(getRecentEvents, ['wiki-home-events'], {
  revalidate: WIKI_CACHE_REVALIDATE,
  tags: [WIKI_PUBLIC_TAG, WIKI_CACHE_TAGS.events],
})

function formatRelativeTime(value: string) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (elapsedSeconds < 60) return '방금 전'
  if (elapsedSeconds < 60 * 60) return `${Math.floor(elapsedSeconds / 60)}분 전`
  if (elapsedSeconds < 24 * 60 * 60) return `${Math.floor(elapsedSeconds / (60 * 60))}시간 전`

  const dateParts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date(value))
  const monthValue = dateParts.find((part) => part.type === 'month')?.value ?? ''
  const dayValue = dateParts.find((part) => part.type === 'day')?.value ?? ''
  return `${monthValue}월 ${dayValue}일`
}

function getBongstagramPreviewMedia(post: BongstagramFeedPost) {
  return post.media[0]
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
    getStatsCached(),
    LIVE_ENABLED ? getLiveStreamers().catch(() => null) : Promise.resolve(null),
    getRecentEventsCached(),
  ])
  const [{ articles: bbsArticles }, { posts: bongstagramPosts }] = await Promise.all([
    getPublishedBbsArticlesPage(undefined, undefined, 1, 4),
    getBongstagramFeedPage(undefined, 4),
  ])

  return (
    <div className="site-theme min-h-[calc(100vh-3.5rem)] bg-[var(--site-page)] text-[var(--site-text)]">
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-10">
        {/* 히어로 */}
        <section className="relative overflow-hidden rounded-2xl border border-[var(--site-border)] bg-gradient-to-br from-[var(--site-hero-start)] via-[var(--site-hero-start)] to-[var(--site-hero-end)] px-6 py-8 sm:px-8 sm:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
          <div className="relative flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-400">
                봉누도 따라가기
              </div>
              <h1 className="text-3xl font-black tracking-tight text-[var(--site-text)] sm:text-4xl">
                오늘의 봉누도 소식
              </h1>
              <p className="max-w-lg text-sm leading-6 text-[var(--site-muted)]">
                사건 기록부터 BBS 기사와 Bongstagram까지,
                <br />
                봉누도2의 흐름을 한 곳에서 확인하세요.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t border-[var(--site-border)] pt-4 text-center sm:min-w-[18rem] sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <div>
                <p className="text-xl font-bold text-[var(--site-text)]">{stats.eventCount ?? 0}</p>
                <p className="mt-1 text-[11px] text-[var(--site-muted)]">사건 기록</p>
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--site-text)]">{stats.characterCount ?? 0}</p>
                <p className="mt-1 text-[11px] text-[var(--site-muted)]">활동 캐릭터</p>
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--site-text)]">{stats.streamerCount ?? 0}</p>
                <p className="mt-1 text-[11px] text-[var(--site-muted)]">활동 스트리머</p>
              </div>
            </div>
          </div>
        </section>

        {/* 라이브 바로가기 */}
        {LIVE_ENABLED && <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <h2 className="text-lg font-bold text-[var(--site-text)]">라이브 바로가기</h2>
            </div>
            <Link href="/live" className="text-sm text-[var(--site-muted)] transition-colors hover:text-amber-400">
              전체 보기 →
            </Link>
          </div>

          {streamers === null ? <LiveDataError /> : streamers.length === 0 ? (
            <div className="rounded-xl border border-[var(--site-border)] bg-[var(--site-card)] py-12 text-center text-sm text-[var(--site-muted)]">
              등록된 스트리머가 없습니다.
            </div>
          ) : (
            <StreamerListWithLive streamers={streamers} onlineOnly />
          )}
        </section>}

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* 최근 사건 */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-500">World log</p>
                <h2 className="mt-1 text-xl font-bold text-[var(--site-text)]">최근 사건</h2>
              </div>
              <Link href="/events" className="text-sm text-[var(--site-muted)] transition-colors hover:text-amber-400">
                전체 보기 →
              </Link>
            </div>

            {events.length === 0 ? (
              <div className="rounded-xl border border-[var(--site-border)] bg-[var(--site-card)] py-12 text-center text-sm text-[var(--site-muted)]">
                기록된 사건이 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-[var(--site-border)] bg-[var(--site-card)] p-3 transition-colors hover:border-amber-400/40 hover:bg-[var(--site-card-raised)] sm:gap-4 sm:p-4"
                  >
                    {event.thumbnail_url ? (
                      <AppImage src={event.thumbnail_url} alt="" width={80} height={64} className="h-16 w-20 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-xs font-semibold text-amber-500">기록</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${eventTypeColor[event.type ?? 'other']}`}>
                          {eventTypeLabel[event.type ?? 'other']}
                        </span>
                        {event.occurred_at && <time className="text-[11px] text-[var(--site-muted)]">{formatRelativeTime(event.occurred_at)}</time>}
                      </div>
                      <p className="mt-1 line-clamp-1 font-semibold text-[var(--site-text)] transition-colors group-hover:text-amber-400">{event.title}</p>
                      {event.summary && <p className="mt-1 line-clamp-1 text-xs text-[var(--site-muted)]">{event.summary}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* BBS 최신 기사 */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e14b32]">Bongnudo Broadcasting System</p>
                <h2 className="mt-1 text-xl font-bold text-[var(--site-text)]">BBS 최신 기사</h2>
              </div>
              <Link href="/bbs" className="text-sm text-[var(--site-muted)] transition-colors hover:text-[#e14b32]">
                전체 보기 →
              </Link>
            </div>

            {bbsArticles.length === 0 ? (
              <div className="rounded-xl border border-[var(--site-border)] bg-[var(--site-card)] py-12 text-center text-sm text-[var(--site-muted)]">
                공개된 기사가 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {bbsArticles.map((article) => {
                  const imageUrl = article.thumbnailUrl ?? article.media[0]?.imageUrl
                  return (
                    <Link
                      key={article.id}
                      href={`/bbs/article/${article.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-[var(--site-border)] bg-[var(--site-card)] p-3 transition-colors hover:border-[#e14b32]/40 hover:bg-[var(--site-card-raised)] sm:gap-4 sm:p-4"
                    >
                      {imageUrl ? (
                        <AppImage src={imageUrl} alt="" width={80} height={64} className="h-16 w-20 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-[#e14b32]/10 text-xs font-black text-[#e14b32]">BBS</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[11px] text-[var(--site-muted)]">
                          <span className="font-medium text-[#e14b32]">{article.category}</span>
                          <span aria-hidden="true">·</span>
                          <BongstagramDisplayName profileName={article.author} streamerName={article.authorStreamerName} />
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-[var(--site-text)] transition-colors group-hover:text-[#d7432d]">{article.title}</p>
                        <time className="mt-1 block text-[11px] text-[var(--site-muted)]">{formatRelativeTime(article.approvedAt)}</time>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        {/* Bongstagram 최신 게시물 */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-400">Social feed</p>
              <h2 className="mt-1 text-xl font-bold text-[var(--site-text)]">Bongstagram 최신 게시물</h2>
            </div>
            <Link href="/bongstagram" className="text-sm text-[var(--site-muted)] transition-colors hover:text-fuchsia-400">
              전체 보기 →
            </Link>
          </div>

          {bongstagramPosts.length === 0 ? (
            <div className="rounded-xl border border-[var(--site-border)] bg-[var(--site-card)] py-12 text-center text-sm text-[var(--site-muted)]">
              등록된 게시물이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {bongstagramPosts.map((post) => {
                const media = getBongstagramPreviewMedia(post)
                return (
                  <Link key={post.id} href={`/bongstagram/post/${post.id}`} className="group overflow-hidden rounded-xl border border-[var(--site-border)] bg-[var(--site-card)] transition-colors hover:border-fuchsia-400/40 hover:bg-[var(--site-card-raised)]">
                    <div className="relative aspect-square overflow-hidden bg-black">
                      {media?.media_type === 'video' ? (
                        <video muted playsInline preload="metadata" src={media.media_url} className="h-full w-full object-cover" aria-label="동영상 게시물" />
                      ) : media ? (
                        <AppImage src={media.media_url} alt="게시물" width={360} height={360} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-500">미디어 없음</div>
                      )}
                    </div>
                    <div className="space-y-1.5 p-3">
                      <p className="truncate text-xs font-semibold text-[var(--site-text)]">
                        <BongstagramDisplayName profileName={post.profile_name} streamerName={post.streamer_name} />
                      </p>
                      <p className="text-[11px] text-[var(--site-muted)]">{formatRelativeTime(post.posted_at)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* 기존 위키 바로가기 */}
        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-muted)]">Explore</p>
            <h2 className="mt-1 text-xl font-bold text-[var(--site-text)]">위키 둘러보기</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickLinks.map(({ href, icon: Icon, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-xl border border-[var(--site-border)] bg-[var(--site-card)] p-3 transition-colors hover:border-amber-400/40 hover:bg-[var(--site-card-raised)] sm:flex-col sm:items-start sm:gap-3 sm:p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 transition-colors group-hover:bg-amber-400/20">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--site-text)]">{label}</p>
                  <p className="mt-0.5 truncate text-xs text-[var(--site-muted)]">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
