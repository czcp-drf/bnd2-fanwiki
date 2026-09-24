'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, User, Search, X } from 'lucide-react'
import { useRedPill } from '@/lib/context/RedPillContext'
import AppImage from '@/components/ui/AppImage'

const statusLabel: Record<string, string> = {
  active: '활동', dead: '사망', retired: '활동 종료', hiatus: '휴식',
}
const statusColor: Record<string, string> = {
  active: 'text-green-400 bg-green-400/10',
  dead: 'text-red-400 bg-red-400/10',
  retired: 'text-zinc-400 bg-zinc-400/10',
  hiatus: 'text-yellow-400 bg-yellow-400/10',
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, '')
}

type Character = {
  id: string
  name: string
  is_name_pending?: boolean
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

function StreamerCard({ streamer }: { streamer: StreamerItem }) {
  const { isRedPill } = useRedPill()
  const characters = streamer.characters ?? []
  const activeChars = characters.filter((character) => character.status === 'active' && !character.is_name_pending)
  const inactiveCharacterSummary = Object.entries(
    characters
      .filter((character) => !character.is_name_pending && character.status !== 'active')
      .reduce<Record<string, number>>((counts, character) => {
        counts[character.status] = (counts[character.status] ?? 0) + 1
        return counts
      }, {})
  )
    .map(([status, count]) => `${statusLabel[status] ?? status} ${count}명`)
    .join(' · ')

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-[#00FFA3]">
      <div className="flex items-center gap-4 border-b border-zinc-800 p-4">
        <div className="relative shrink-0">
          {streamer.profile_image_url ? (
            <AppImage
              src={streamer.profile_image_url}
              alt={streamer.display_name}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-zinc-700 transition-all group-hover:ring-[#00FFA3]"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-700 text-xl font-black text-zinc-400 ring-2 ring-zinc-700 transition-all group-hover:ring-[#00FFA3]">
              {streamer.display_name.charAt(0) || '?'}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="min-w-0 truncate font-bold text-white">{streamer.display_name}</p>
            {!streamer.is_active && (
              <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                활동 전
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-2 p-4">
        {!isRedPill ? (
          <p className="text-xs text-zinc-600">빨간약을 켜면 캐릭터 정보를 볼 수 있습니다.</p>
        ) : activeChars.length === 0 ? (
          <p className="text-xs text-zinc-600">등록된 캐릭터 없음</p>
        ) : (
          activeChars.map((character) => (
            <Link
              key={character.id}
              href={`/characters/${character.id}`}
              className="flex items-center justify-between rounded-lg bg-zinc-800 px-3 py-2 transition-colors hover:bg-zinc-700"
            >
              <div className="flex min-w-0 items-center gap-2">
                <User size={12} className="shrink-0 text-zinc-500" />
                <span className="truncate text-sm font-medium text-zinc-200">{character.name}</span>
                {(character.job || (character.organizations?.length ?? 0) > 0) && (
                  <span className="hidden truncate text-xs text-zinc-500 sm:block">
                    · {character.organizations?.length
                      ? character.organizations.map((organization) => organization.name).join(' · ')
                      : character.job}
                  </span>
                )}
              </div>
              <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[character.status]}`}>
                {statusLabel[character.status]}
              </span>
            </Link>
          ))
        )}
        {isRedPill && inactiveCharacterSummary && (
          <p className="pt-1 text-xs text-zinc-600">
            {inactiveCharacterSummary}
          </p>
        )}
      </div>

      <div className="flex border-t border-zinc-800">
        <Link
          href={`/streamers/${streamer.id}`}
          className="flex-1 py-3 text-center text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          스트리머 상세보기
        </Link>
        <div className="w-px bg-zinc-800" />
        <a
          href={`https://chzzk.naver.com/${streamer.chzzk_channel_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-amber-400"
        >
          <ExternalLink size={11} />
          치지직
        </a>
      </div>
    </div>
  )
}

export default function StreamerListWithLive({ streamers }: { streamers: StreamerItem[] }) {
  const [search, setSearch] = useState('')
  const { isRedPill } = useRedPill()

  const matchSearch = (streamer: StreamerItem) => {
    const query = normalizeSearchText(search)
    if (!query) return true
    if (isRedPill) {
      return normalizeSearchText(streamer.display_name).includes(query) ||
        streamer.characters.some((character) => !character.is_name_pending && normalizeSearchText(character.name).includes(query))
    }
    return normalizeSearchText(streamer.display_name).includes(query)
  }

  const allActive = streamers.filter((streamer) => streamer.is_active)
  const allInactive = streamers.filter((streamer) => !streamer.is_active)
  const activeStreamers = allActive.filter(matchSearch)
  const inactiveStreamers = allInactive.filter(matchSearch)

  return (
    <div className="space-y-8">
      <div className="relative max-w-xs">
        <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={isRedPill ? '스트리머 또는 캐릭터명 검색...' : '스트리머 이름 검색...'}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-8 pr-8 text-sm text-white placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            aria-label="검색어 지우기"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-300">
          스트리머 <span className="font-normal text-zinc-500">({activeStreamers.length}명{search.trim() ? ` / 전체 ${allActive.length}명` : ''})</span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeStreamers.map((streamer) => (
            <StreamerCard key={streamer.id} streamer={streamer} />
          ))}
        </div>
      </section>

      {inactiveStreamers.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-500">
            활동 전 스트리머 <span className="font-normal">({inactiveStreamers.length}명{search.trim() ? ` / 전체 ${allInactive.length}명` : ''})</span>
          </h2>
          <div className="grid gap-4 opacity-60 sm:grid-cols-2 lg:grid-cols-3">
            {inactiveStreamers.map((streamer) => (
              <StreamerCard key={streamer.id} streamer={streamer} />
            ))}
          </div>
        </section>
      )}

      {activeStreamers.length === 0 && inactiveStreamers.length === 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center text-sm text-zinc-500">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  )
}
