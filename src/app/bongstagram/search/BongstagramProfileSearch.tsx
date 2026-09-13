'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import BongstagramDisplayName from '../BongstagramDisplayName'
import BongstagramInfinitePostGrid from '../BongstagramInfinitePostGrid'
import BongstagramProfileAvatar from '../BongstagramProfileAvatar'
import { useRedPill } from '@/lib/context/RedPillContext'
import type { BongstagramPostCursor } from '@/lib/bongstagram/types'

const RECENT_SEARCHES_KEY = 'bongstagram-recent-searches'

type Profile = { character_id: string; profile_name: string; avatar_url: string | null }
type Character = { id: string; name: string; avatar_url: string | null; streamer_id: string | null }
type Streamer = { id: string; display_name: string; profile_image_url: string | null }
type ProfilePost = { id: string; character_id: string; media_type: 'image' | 'video' | null; media_url: string | null }
type RecentSearch = { character_id: string }

function readRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') return []
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY) ?? '[]')
    return Array.isArray(value)
      ? value.filter((item): item is RecentSearch => Boolean(item) && typeof item === 'object' && typeof item.character_id === 'string')
      : []
  } catch {
    return []
  }
}

function writeRecentSearches(items: RecentSearch[]) {
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items.slice(0, 10)))
}

function ProfileSearchRow({
  profile,
  character,
  streamer,
  onOpen,
  onRemove,
}: {
  profile: Profile
  character: Character | undefined
  streamer: Streamer | null
  onOpen: () => void
  onRemove?: () => void
}) {
  const { isRedPill } = useRedPill()

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 transition-colors hover:bg-zinc-800/40">
      <Link href={`/bongstagram/${profile.character_id}`} onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-sm font-semibold text-zinc-300">
          <BongstagramProfileAvatar profileAvatarUrl={profile.avatar_url} streamerAvatarUrl={streamer?.profile_image_url} fallbackAvatarUrl={character?.avatar_url} profileName={profile.profile_name} streamerName={streamer?.display_name} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-zinc-200"><BongstagramDisplayName profileName={profile.profile_name} streamerName={streamer?.display_name} /></p>
          <p className="mt-1 truncate text-sm text-zinc-400">{character?.name ?? '캐릭터 없음'}{isRedPill && streamer ? ` · ${streamer.display_name}` : ''}</p>
        </div>
      </Link>
      {onRemove && <button type="button" onClick={onRemove} aria-label={`${profile.profile_name} 최근 검색에서 삭제`} className="cursor-pointer p-2 text-zinc-400 transition-colors hover:text-white"><X size={25} strokeWidth={1.8} /></button>}
    </div>
  )
}

export default function BongstagramProfileSearch({
  profiles,
  characters,
  streamers,
  posts,
  gridCursor = null,
  gridHasMore = false,
}: {
  profiles: Profile[]
  characters: Character[]
  streamers: Streamer[]
  posts: ProfilePost[]
  gridCursor?: BongstagramPostCursor | null
  gridHasMore?: boolean
}) {
  const [search, setSearch] = useState('')
  const [searchMode, setSearchMode] = useState(false)
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const { isRedPill } = useRedPill()
  const characterById = useMemo(() => new Map(characters.map((character) => [character.id, character])), [characters])
  const streamerById = useMemo(() => new Map(streamers.map((streamer) => [streamer.id, streamer])), [streamers])
  const profileById = useMemo(() => new Map(profiles.map((profile) => [profile.character_id, profile])), [profiles])
  const normalizedSearch = search.trim().toLocaleLowerCase()

  const filteredProfiles = useMemo(() => profiles.filter((profile) => {
    const character = characterById.get(profile.character_id)
    const streamer = character?.streamer_id ? streamerById.get(character.streamer_id) : null
    const target = `${profile.profile_name} ${character?.name ?? ''}${isRedPill ? ` ${streamer?.display_name ?? ''}` : ''}`.toLocaleLowerCase()
    return target.includes(normalizedSearch)
  }), [characterById, isRedPill, normalizedSearch, profiles, streamerById])

  const recentProfiles = useMemo(() => recentSearches.map((item) => profileById.get(item.character_id)).filter((profile): profile is Profile => Boolean(profile)), [profileById, recentSearches])

  useEffect(() => {
    const timer = window.setTimeout(() => setRecentSearches(readRecentSearches()), 0)
    return () => window.clearTimeout(timer)
  }, [])

  function openProfile(profile: Profile) {
    const next = [{ character_id: profile.character_id }, ...recentSearches.filter((item) => item.character_id !== profile.character_id)]
    setRecentSearches(next)
    writeRecentSearches(next)
  }

  function removeRecent(characterId: string) {
    const next = recentSearches.filter((item) => item.character_id !== characterId)
    setRecentSearches(next)
    writeRecentSearches(next)
  }

  function clearRecent() {
    setRecentSearches([])
    writeRecentSearches([])
  }

  function enterSearchMode() {
    setSearchMode(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function cancelSearch() {
    setSearch('')
    setSearchMode(false)
    inputRef.current?.blur()
  }

  return (
    <main>
      <div className="px-6 pb-5 pt-5">
        <div className="flex items-center gap-4">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">프로필 검색</span>
            <Search size={24} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input ref={inputRef} value={search} onFocus={() => setSearchMode(true)} onChange={(event) => { setSearch(event.target.value); setSearchMode(true) }} onClick={enterSearchMode} placeholder="검색" className="h-14 w-full rounded-full bg-zinc-800 px-14 text-lg text-zinc-200 placeholder:text-zinc-400 focus:bg-zinc-700 focus:outline-none" />
          </label>
          {searchMode && <button type="button" onClick={cancelSearch} className="shrink-0 cursor-pointer text-base font-semibold text-white transition-colors hover:text-zinc-300">취소</button>}
        </div>
      </div>

      {searchMode ? (
        <section className="px-6" aria-label={normalizedSearch ? '검색 결과' : '최근 검색 항목'}>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">{normalizedSearch ? '검색 결과' : '최근 검색 항목'}</h1>
            {!normalizedSearch && recentProfiles.length > 0 && <button type="button" onClick={clearRecent} className="cursor-pointer text-base font-medium text-indigo-400 transition-colors hover:text-indigo-300">모두 지우기</button>}
          </div>
          <div className="mt-3 space-y-1">
            {(normalizedSearch ? filteredProfiles : recentProfiles).map((profile) => {
              const character = characterById.get(profile.character_id)
              const streamer = character?.streamer_id ? streamerById.get(character.streamer_id) ?? null : null
              return <ProfileSearchRow key={profile.character_id} profile={profile} character={character} streamer={streamer} onOpen={() => openProfile(profile)} onRemove={!normalizedSearch ? () => removeRecent(profile.character_id) : undefined} />
            })}
          </div>
          {(normalizedSearch ? filteredProfiles : recentProfiles).length === 0 && <p className="py-16 text-center text-sm text-zinc-500">{normalizedSearch ? '검색 결과가 없습니다.' : '최근 검색 항목이 없습니다.'}</p>}
        </section>
      ) : <BongstagramInfinitePostGrid initialPosts={posts} initialCursor={gridCursor} initialHasMore={gridHasMore} />}
    </main>
  )
}
