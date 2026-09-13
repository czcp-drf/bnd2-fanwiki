'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import BongstagramDisplayName from '../BongstagramDisplayName'
import BongstagramProfileAvatar from '../BongstagramProfileAvatar'
import { useRedPill } from '@/lib/context/RedPillContext'

type Profile = { character_id: string; profile_name: string; avatar_url: string | null }
type Character = { id: string; name: string; avatar_url: string | null; streamer_id: string | null }
type Streamer = { id: string; display_name: string; profile_image_url: string | null }

export default function BongstagramProfileSearch({ profiles, characters, streamers }: { profiles: Profile[]; characters: Character[]; streamers: Streamer[] }) {
  const [search, setSearch] = useState('')
  const { isRedPill } = useRedPill()
  const characterById = useMemo(() => new Map(characters.map((character) => [character.id, character])), [characters])
  const streamerById = useMemo(() => new Map(streamers.map((streamer) => [streamer.id, streamer])), [streamers])
  const filteredProfiles = profiles.filter((profile) => {
    const character = characterById.get(profile.character_id)
    const streamer = character?.streamer_id ? streamerById.get(character.streamer_id) : null
    const target = `${profile.profile_name} ${character?.name ?? ''} ${streamer?.display_name ?? ''}`.toLocaleLowerCase()
    return target.includes(search.trim().toLocaleLowerCase())
  })

  return (
    <main className="px-4 py-5">
      <label className="block"><span className="sr-only">프로필 검색</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isRedPill ? '프로필·캐릭터·스트리머 검색' : '프로필·캐릭터 검색'} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-fuchsia-400/60 focus:outline-none" /></label>
      <p className="mt-4 text-xs text-zinc-500">프로필 {filteredProfiles.length}개</p>
      {filteredProfiles.length === 0 ? <p className="py-16 text-center text-sm text-zinc-600">검색 결과가 없습니다.</p> : <div className="mt-3 divide-y divide-zinc-800/80">{filteredProfiles.map((profile) => {
        const character = characterById.get(profile.character_id)
        const streamer = character?.streamer_id ? streamerById.get(character.streamer_id) : null
        return <Link key={profile.character_id} href={`/bongstagram/${profile.character_id}`} className="flex items-center gap-3 px-1 py-3 transition-colors hover:bg-zinc-900/70">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-sm font-semibold text-zinc-300"><BongstagramProfileAvatar profileAvatarUrl={profile.avatar_url} streamerAvatarUrl={streamer?.profile_image_url} fallbackAvatarUrl={character?.avatar_url} profileName={profile.profile_name} streamerName={streamer?.display_name} className="h-full w-full object-cover" /></div>
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-zinc-200"><BongstagramDisplayName profileName={profile.profile_name} streamerName={streamer?.display_name} /></p><p className="mt-1 truncate text-xs text-zinc-500">{character?.name ?? '캐릭터 없음'}{isRedPill && streamer ? ` · ${streamer.display_name}` : ''}</p></div>
        </Link>
      })}</div>}
    </main>
  )
}
