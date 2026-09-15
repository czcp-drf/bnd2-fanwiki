export const revalidate = 60

import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { WIKI_CACHE_REVALIDATE, WIKI_CACHE_TAGS, WIKI_PUBLIC_TAG } from '@/lib/cache/wiki'
import type { Event } from '@/types/database'
import AppImage from '@/components/ui/AppImage'
import { BBS_ARTICLE_LIST_TAG, getPublishedBbsArticlesPage } from '@/lib/bbs/data'
import BbsHomeLink from '@/components/bbs/BbsHomeLink'
import BongstagramDisplayName from '@/app/bongstagram/BongstagramDisplayName'
import { Archive, Map, Newspaper, Users } from 'lucide-react'

async function getStats() {
  const supabase = createPublicClient()
  const [{ count: eventCount }, { count: bbsArticleCount }] =
    await Promise.all([
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('bbs_articles').select('*', { count: 'exact', head: true }).eq('is_published', true),
    ])
  return { eventCount, bbsArticleCount }
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
  tags: [WIKI_PUBLIC_TAG, WIKI_CACHE_TAGS.events, BBS_ARTICLE_LIST_TAG],
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

const eventTypeLabel: Record<string, string> = {
  war: '전쟁',
  crime: '범죄',
  political: '정치',
  social: '사회',
  accident: '사고',
  highlight: '하이라이트',
  other: '기타',
}

const eventTypeColor: Record<string, string> = {
  war: 'text-red-400 bg-red-400/10',
  crime: 'text-orange-400 bg-orange-400/10',
  political: 'text-blue-400 bg-blue-400/10',
  social: 'text-green-400 bg-green-400/10',
  accident: 'text-yellow-400 bg-yellow-400/10',
  highlight: 'text-fuchsia-400 bg-fuchsia-400/10',
  other: 'text-zinc-400 bg-zinc-400/10',
}

const quickLinks = [
  { href: '/events', label: '사건 아카이브', description: '봉누도2의 주요 사건과 흐름을 확인하세요.', icon: Archive, color: 'text-amber-500 bg-amber-400/10' },
  { href: '/bbs', label: 'BBS 기사', description: '봉누도 방송국의 최신 기사를 확인하세요.', icon: Newspaper, color: 'text-[#e14b32] bg-[#e14b32]/10' },
  { href: '/map', label: '주요 장소 지도', description: '사건과 조직의 위치를 지도에서 살펴보세요.', icon: Map, color: 'text-sky-500 bg-sky-400/10' },
  { href: '/characters', label: '인물 둘러보기', description: '스트리머와 캐릭터 정보를 찾아보세요.', icon: Users, color: 'text-emerald-500 bg-emerald-400/10' },
]

export default async function HomePage() {
  const [stats, events] = await Promise.all([
    getStatsCached(),
    getRecentEventsCached(),
  ])
  const { articles: bbsArticles } = await getPublishedBbsArticlesPage(undefined, undefined, 1, 4)

  return (
    <div className="site-theme min-h-[calc(100vh-3.5rem)] bg-[var(--site-page)] text-[var(--site-text)]">
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-10">
        {/* 히어로 */}
        <section className="relative overflow-hidden rounded-2xl border border-[var(--site-border)] bg-gradient-to-br from-[var(--site-hero-start)] via-[var(--site-hero-start)] to-[var(--site-hero-end)] px-6 py-8 sm:px-8 sm:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
          <div className="relative flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="inline-block rounded-full border border-amber-300 bg-amber-300 px-3 py-1 text-xs font-bold text-zinc-950 shadow-sm shadow-amber-500/30">
                봉누도 따라가기
              </div>
              <h1 className="text-3xl font-black tracking-tight text-[var(--site-text)] sm:text-4xl">
                오늘의 봉누도 소식
              </h1>
              <p className="max-w-lg text-sm leading-6 text-[var(--site-muted)]">
                사건 기록부터 BBS 기사까지,
                <br />
                봉누도2의 흐름을 한 곳에서 확인하세요.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-[var(--site-border)] pt-4 text-center sm:min-w-[18rem] sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <div>
                <p className="text-xl font-bold text-[var(--site-text)]">{stats.eventCount ?? 0}</p>
                <p className="mt-1 text-[11px] text-[var(--site-muted)]">사건 기록</p>
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--site-text)]">{stats.bbsArticleCount ?? 0}</p>
                <p className="mt-1 text-[11px] text-[var(--site-muted)]">BBS 기사 수</p>
              </div>
            </div>
          </div>
        </section>

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
                      <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 px-1 text-center text-xs font-semibold text-amber-500">
                        {eventTypeLabel[event.type ?? 'other'] ?? '기타'}
                      </div>
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
              <BbsHomeLink className="text-sm text-[var(--site-muted)] transition-colors hover:text-[#e14b32]">
                전체 보기 →
              </BbsHomeLink>
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

        {/* 빠른 탐색 */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-muted)]">Explore the archive</p>
              <h2 className="mt-1 text-xl font-bold text-[var(--site-text)]">빠른 탐색</h2>
            </div>
            <span className="text-xs text-[var(--site-muted)]">봉누도 따라가기</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map(({ href, label, description, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-2xl border border-[var(--site-border)] bg-[var(--site-card)] p-5 transition-colors hover:border-amber-400/40 hover:bg-[var(--site-card-raised)]"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon size={19} />
                </span>
                <span className="mt-4 flex items-center justify-between gap-2">
                  <span className="font-bold text-[var(--site-text)] transition-colors group-hover:text-amber-400">{label}</span>
                  <span aria-hidden="true" className="text-lg text-[var(--site-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-amber-400">→</span>
                </span>
                <span className="mt-2 block text-xs leading-5 text-[var(--site-muted)]">{description}</span>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
