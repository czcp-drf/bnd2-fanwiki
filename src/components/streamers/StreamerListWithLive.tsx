'use client'

import { useState } from 'react'
import { useLiveStatus } from '@/lib/live/useLiveStatus'
import Link from 'next/link'
import { ExternalLink, User, Search, X } from 'lucide-react'
import { useRedPill } from '@/lib/context/RedPillContext'
import AppImage from '@/components/ui/AppImage'

const statusLabel: Record<string, string> = {
  active: '활동', dead: '사망', retired: '은퇴', hiatus: '휴식',
}
const statusColor: Record<string, string> = {
  active: 'text-green-400 bg-green-400/10',
  dead: 'text-red-400 bg-red-400/10',
  retired: 'text-zinc-400 bg-zinc-400/10',
  hiatus: 'text-yellow-400 bg-yellow-400/10',
}

type Character = {
  id: string
  name: string
  avatar_url?: string | null
  job: string | null
  status: string
  organizations?: Array<{ id: string; name: string; color: string | null }>
}
export type StreamerItem = {
  id: string
  display_name: string
  profile_image_url: string | null
  chzzk_channel_id: string
  is_active: boolean
  characters: Character[]
}

function StreamerCard({
  streamer,
  isLive,
  liveDisplay,
  liveTitle,
  compact = false,
}: {
  streamer: StreamerItem
  isLive: boolean
  liveDisplay: boolean
  liveTitle?: string | null
  compact?: boolean
}) {
  const { isRedPill } = useRedPill()
  const characters = streamer.characters ?? []
  const activeChars = characters.filter((c) => c.status === 'active')
  const primaryCharacter = activeChars[0]
  const organizations = primaryCharacter?.organizations ?? []
  const organizationLabel = organizations.length > 0
    ? organizations.map((organization) => organization.name).join(' · ')
    : '무소속'
  const directoryHeading = isRedPill && primaryCharacter ? primaryCharacter.name : streamer.display_name
  const liveHeading = isRedPill ? streamer.display_name : primaryCharacter?.name ?? '캐릭터 미등록'
  const heading = liveDisplay ? liveHeading : directoryHeading
  const displayedTitle = liveTitle && !isRedPill && primaryCharacter
    ? [streamer.display_name]
        .filter((name): name is string => Boolean(name))
        .reduce((title, name) => title.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), () => primaryCharacter.name), liveTitle)
    : liveTitle

  if (compact) return (
    <a href={`https://chzzk.naver.com/live/${streamer.chzzk_channel_id}`} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-zinc-900 p-3 hover:bg-zinc-800 transition-colors">
      {isRedPill && streamer.profile_image_url ? (
        <AppImage src={streamer.profile_image_url} alt={heading} className="h-10 w-10 shrink-0 rounded-full object-cover" />
      ) : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-amber-400">{heading.charAt(0)}</span>}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{heading}</p>
        <p className="truncate text-xs text-zinc-500">{organizationLabel}</p>
        {displayedTitle && <p className="truncate text-xs text-zinc-400" title={displayedTitle}>{displayedTitle}</p>}
      </div>
      <span className="text-[10px] font-bold text-red-400">LIVE</span>
    </a>
  )

  return (
    <div className={`group flex flex-col rounded-xl border bg-zinc-900 overflow-hidden transition-colors hover:border-zinc-600 ${
      isLive ? 'border-red-500/30 hover:border-red-500/50' : 'border-zinc-800'
    }`}>
      <div className="flex items-center gap-4 p-4 border-b border-zinc-800">
        <div className="relative shrink-0">
          {liveDisplay && isRedPill && streamer.profile_image_url ? (
            <AppImage
              src={streamer.profile_image_url}
              alt={streamer.display_name}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-zinc-700 group-hover:ring-amber-400/40 transition-all"
            />
          ) : liveDisplay && !isRedPill ? (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/10 ring-2 ring-amber-400/20 text-xl font-black text-amber-400">
              {primaryCharacter?.name.charAt(0) ?? '?'}
            </div>
          ) : streamer.profile_image_url ? (
            <AppImage
              src={streamer.profile_image_url}
              alt={streamer.display_name}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-zinc-700 group-hover:ring-amber-400/40 transition-all"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-700 ring-2 ring-zinc-700 group-hover:ring-amber-400/40 transition-all text-xl font-black text-zinc-400">
              {(liveDisplay ? primaryCharacter?.name : streamer.display_name)?.charAt(0) ?? '?'}
            </div>
          )}
          {isLive && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900">
              <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="min-w-0 flex-1 font-bold text-white truncate">{heading}</p>
          {liveDisplay && isRedPill && primaryCharacter && (
            <p className="text-xs text-zinc-500 mt-0.5 truncate">{primaryCharacter.name}</p>
          )}
          {liveDisplay && primaryCharacter && (
            <p className="text-xs text-zinc-500 mt-0.5 truncate">
              {organizationLabel}
            </p>
          )}
          {isLive && <p className="text-xs font-semibold text-red-400 mt-0.5">LIVE</p>}
        </div>

        {organizations.length > 0 && (
          <div className="max-w-[45%] shrink-0 flex flex-wrap justify-end gap-1 self-start">
            {organizations.map((organization) => (
              <span
                key={organization.id}
                className="rounded-full border px-1.5 py-0.5 text-[10px] font-medium truncate"
                style={organization.color
                  ? { borderColor: `${organization.color}60`, color: organization.color, backgroundColor: `${organization.color}12` }
                  : undefined}
                title={organization.name}
              >
                {organization.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 p-4 space-y-2">
        {liveDisplay && !isRedPill ? (
          <p className="text-xs text-zinc-500">빨간약을 켜면 스트리머 정보를 볼 수 있습니다.</p>
        ) : !isRedPill ? (
          <p className="text-xs text-zinc-600">빨간약을 켜면 캐릭터 정보를 볼 수 있습니다.</p>
        ) : activeChars.length === 0 ? (
          <p className="text-xs text-zinc-600">등록된 캐릭터 없음</p>
        ) : (
          activeChars.map((c) => (
            <Link
              key={c.id}
              href={`/characters/${c.id}`}
              className="flex items-center justify-between rounded-lg bg-zinc-800 px-3 py-2 hover:bg-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <User size={12} className="text-zinc-500 shrink-0" />
                <span className="text-sm font-medium text-zinc-200 truncate">{c.name}</span>
                {(c.job || c.organizations?.length === 0) && (
                  <span className="text-xs text-zinc-500 truncate hidden sm:block">
                    · {c.organizations?.length
                      ? c.organizations.map((organization) => organization.name).join(' · ')
                      : '무소속'}
                  </span>
                )}
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ml-2 ${statusColor[c.status]}`}>
                {statusLabel[c.status]}
              </span>
            </Link>
          ))
        )}
        {isRedPill && characters.length > activeChars.length && (
          <p className="text-xs text-zinc-600 pt-1">
            +{characters.length - activeChars.length}개 비활동 캐릭터
          </p>
        )}
        {isLive && displayedTitle && (
          <p className="border-t border-zinc-800 pt-2 text-xs text-zinc-400 line-clamp-2" title={displayedTitle}>
            {displayedTitle}
          </p>
        )}
      </div>

      <div className="flex border-t border-zinc-800">
        <Link
          href={liveDisplay && !isRedPill && primaryCharacter
            ? `/characters/${primaryCharacter.id}`
            : `/streamers/${streamer.id}`}
          className="flex-1 py-3 text-center text-xs font-medium text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          {liveDisplay && !isRedPill && primaryCharacter ? '캐릭터 상세보기' : '스트리머 상세보기'}
        </Link>
        <div className="w-px bg-zinc-800" />
        <a
          href={
            isLive
              ? `https://chzzk.naver.com/live/${streamer.chzzk_channel_id}`
              : `https://chzzk.naver.com/${streamer.chzzk_channel_id}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors hover:bg-zinc-800 ${
            isLive ? 'text-red-400 hover:text-red-300' : 'text-zinc-500 hover:text-amber-400'
          }`}
        >
          <ExternalLink size={11} />
          {isLive ? '방송 보기' : '치지직'}
        </a>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center text-zinc-500 text-sm">
      {message}
    </div>
  )
}

export default function StreamerListWithLive({
  streamers,
  liveStatus = true,
  onlineOnly = false,
}: {
  streamers: StreamerItem[]
  liveStatus?: boolean
  onlineOnly?: boolean
}) {
  const [search, setSearch] = useState('')

  const matchSearch = (s: StreamerItem) => {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return (
      s.display_name.toLowerCase().includes(q) ||
      s.characters.some((c) => c.name.toLowerCase().includes(q))
    )
  }

  const allActive = streamers.filter((s) => s.is_active)
  const allInactive = streamers.filter((s) => !s.is_active)
  const activeStreamers = allActive.filter(matchSearch)
  const inactiveStreamers = allInactive.filter(matchSearch)
  const activeIds = activeStreamers.map((s) => s.chzzk_channel_id).join(',')
  const { map: liveMap, loading: isLoading, refreshing, checkedAt, retry } = useLiveStatus(activeIds, liveStatus)

  if (!liveStatus) {
    return (
      <div className="space-y-8">
        {/* 검색창 */}
        <div className="relative max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 캐릭터 검색..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-8 pr-8 text-sm text-white placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300">
            스트리머 <span className="text-zinc-500 font-normal">({activeStreamers.length}명{search.trim() ? ` / 전체 ${allActive.length}명` : ''})</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeStreamers.map((s) => (
              <StreamerCard key={s.id} streamer={s} isLive={false} liveDisplay={false} />
            ))}
          </div>
        </section>

        {inactiveStreamers.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-500">
              비활동 <span className="font-normal">({inactiveStreamers.length}명{search.trim() ? ` / 전체 ${allInactive.length}명` : ''})</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
              {inactiveStreamers.map((s) => (
                <StreamerCard key={s.id} streamer={s} isLive={false} liveDisplay={false} />
              ))}
            </div>
          </section>
        )}

        {activeStreamers.length === 0 && inactiveStreamers.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center text-zinc-500 text-sm">
            검색 결과가 없습니다.
          </div>
        )}
      </div>
    )
  }

  const isStreamerLive = (streamer: StreamerItem) => {
    const status = liveMap?.[streamer.chzzk_channel_id]
    return status?.live === true
  }
  const getLiveTitle = (streamer: StreamerItem) => {
    const status = liveMap?.[streamer.chzzk_channel_id]
    return status?.title
  }
  const onlineStreamers = activeStreamers.filter(isStreamerLive)
  const offlineStreamers = activeStreamers.filter((s) => liveMap[s.chzzk_channel_id]?.live === false)
  const unknownCount = activeStreamers.length - onlineStreamers.length - offlineStreamers.length
  const displayOnline = onlineOnly ? onlineStreamers.slice(0, 9) : onlineStreamers

  return (
    <div className="space-y-10">
      {/* 상태바 — /live 페이지에서만 표시 */}
      {!onlineOnly && (
        <>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span>{!activeIds ? '조회할 스트리머가 없습니다.' : checkedAt ? `마지막 조회 ${new Date(checkedAt).toLocaleTimeString('ko-KR')} · 60초마다 갱신` : '라이브 상태 확인 중…'}</span>
            <button onClick={retry} disabled={refreshing || !activeIds} className="rounded border border-zinc-700 px-2 py-1 text-amber-400 disabled:opacity-50">{refreshing ? '확인 중…' : '새로고침'}</button>
          </div>
          {!isLoading && unknownCount > 0 && <p role="alert" className="rounded-lg border border-amber-400/30 p-3 text-sm text-amber-400">{unknownCount}명의 방송 상태를 확인하지 못했습니다. 새로고침으로 다시 시도해 주세요.</p>}
        </>
      )}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="h-2 w-2 rounded-full bg-zinc-600" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          )}
          <h2 className="text-sm font-semibold text-zinc-300">
            온라인{' '}
            <span className="text-zinc-500 font-normal">
              {isLoading ? '…' : `(${onlineStreamers.length}명)`}
            </span>
          </h2>
        </div>

        {isLoading ? (
          <div className={`grid gap-4 ${onlineOnly ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
            {Array.from({ length: onlineOnly ? 4 : 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 animate-pulse">
                <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-2/3 rounded bg-zinc-800" />
                  <div className="h-2.5 w-1/3 rounded bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        ) : onlineStreamers.length === 0 ? (
          <EmptyState message={unknownCount > 0 ? '현재 확인된 라이브 방송이 없습니다.' : '현재 방송 중인 스트리머가 없습니다.'} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayOnline.map((s, i) => (
              <div key={s.id} className={onlineOnly && i >= 4 ? 'hidden sm:block' : undefined}>
                <StreamerCard streamer={s} isLive liveDisplay liveTitle={getLiveTitle(s)} compact={onlineOnly} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 오프라인 */}
      {!onlineOnly && (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-zinc-600" />
          <h2 className="text-sm font-semibold text-zinc-300">
            오프라인{' '}
            <span className="text-zinc-500 font-normal">
              {isLoading ? '확인 중…' : `(${offlineStreamers.length}명)`}
            </span>
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offlineStreamers.map((s) => (
              <StreamerCard key={s.id} streamer={s} isLive={false} liveDisplay />
          ))}
        </div>
      </section>

      )}
      {/* 비활동 */}
      {!onlineOnly && inactiveStreamers.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-500">
            비활동 <span className="font-normal">({inactiveStreamers.length}명)</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
            {inactiveStreamers.map((s) => (
              <StreamerCard key={s.id} streamer={s} isLive={false} liveDisplay />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
