'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Grid3X3, Search, UserRound, UsersRound } from 'lucide-react'
import BongstagramDisplayName from '../BongstagramDisplayName'
import BongstagramFollowButton from '../BongstagramFollowButton'
import BongstagramProfileAvatar from '../BongstagramProfileAvatar'
import { readBongstagramFollowing } from '@/lib/bongstagram/following'
import { useRedPill } from '@/lib/context/RedPillContext'

type Profile = { character_id: string; profile_name: string; avatar_url: string | null }
type Character = { id: string; name: string; avatar_url: string | null; streamer_id: string | null }
type Streamer = { id: string; display_name: string; profile_image_url: string | null }

export default function BongstagramMyProfile({ profiles, characters, streamers }: { profiles: Profile[]; characters: Character[]; streamers: Streamer[] }) {
  const [followingIds, setFollowingIds] = useState<string[]>([])
  const [followingOpen, setFollowingOpen] = useState(false)
  const [followingSearch, setFollowingSearch] = useState('')
  const { isRedPill } = useRedPill()
  const characterById = useMemo(() => new Map(characters.map((character) => [character.id, character])), [characters])
  const streamerById = useMemo(() => new Map(streamers.map((streamer) => [streamer.id, streamer])), [streamers])

  useEffect(() => {
    const sync = () => setFollowingIds(readBongstagramFollowing())
    sync()
  }, [])

  const followingProfiles = followingIds.map((id) => {
    const profile = profiles.find((item) => item.character_id === id)
    const character = characterById.get(id)
    const streamer = character?.streamer_id ? streamerById.get(character.streamer_id) : null
    return profile && { profile, character, streamer }
  }).filter((item): item is { profile: Profile; character: Character | undefined; streamer: Streamer | null | undefined } => Boolean(item))
  const filteredFollowingProfiles = followingProfiles.filter(({ profile, character, streamer }) => `${profile.profile_name} ${character?.name ?? ''}${isRedPill ? ` ${streamer?.display_name ?? ''}` : ''}`.toLocaleLowerCase().includes(followingSearch.trim().toLocaleLowerCase()))

  function openFollowing() {
    setFollowingIds(readBongstagramFollowing())
    setFollowingSearch('')
    setFollowingOpen(true)
  }

  return (
    <main>
      <header className="flex h-16 items-center justify-between border-b border-zinc-800 px-5"><h1 className="text-lg font-semibold text-white">내 프로필</h1><span className="text-xs text-zinc-600">Bongstagram</span></header>
      <section className="px-5 pb-5 pt-6">
        <div className="flex items-center gap-5">
          <div className="rounded-full bg-gradient-to-tr from-amber-300 via-fuchsia-500 to-sky-400 p-[3px]"><div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-zinc-950 text-zinc-400"><UserRound size={34} strokeWidth={1.5} /></div></div>
          <div className="grid min-w-0 flex-1 grid-cols-3 text-center"><div><strong className="block text-base text-white">0</strong><span className="mt-1 block text-xs text-zinc-500">게시물</span></div><div><strong className="block text-base text-white">0</strong><span className="mt-1 block text-xs text-zinc-500">팔로워</span></div><button type="button" onClick={openFollowing} className="cursor-pointer"><strong className="block text-base text-white">{followingIds.length}</strong><span className="mt-1 block text-xs text-zinc-500">팔로우</span></button></div>
        </div>
        <div className="mt-4"><h2 className="text-base font-bold text-white">나의 Bongstagram</h2><p className="mt-1 text-sm text-zinc-400">팔로우한 계정의 소식을 모아보세요.</p></div>
      </section>

      {followingOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setFollowingOpen(false) }}><section className="flex max-h-[min(75vh,42rem)] w-full max-w-[540px] flex-col rounded-t-2xl border border-zinc-800 bg-zinc-950 sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="following-title"><header className="relative flex h-16 shrink-0 items-center border-b border-zinc-800 px-5"><button type="button" onClick={() => setFollowingOpen(false)} aria-label="팔로잉 목록 닫기" className="cursor-pointer text-zinc-300 transition-colors hover:text-white"><ArrowLeft size={23} /></button><h2 id="following-title" className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-white">팔로잉</h2></header><div className="shrink-0 px-5 py-3"><label className="relative block"><span className="sr-only">팔로잉 검색</span><Search size={19} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" /><input value={followingSearch} onChange={(event) => setFollowingSearch(event.target.value)} placeholder="검색" className="w-full rounded-xl bg-zinc-800 px-10 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:bg-zinc-700 focus:outline-none" /></label></div><div className="overflow-y-auto px-5 pb-5">{filteredFollowingProfiles.length === 0 ? <p className="py-16 text-center text-sm text-zinc-600">{followingProfiles.length === 0 ? '아직 팔로우한 계정이 없습니다.' : '검색 결과가 없습니다.'}</p> : <div>{filteredFollowingProfiles.map(({ profile, character, streamer }) => <div key={profile.character_id} className="flex items-center gap-3 py-3"><Link href={`/bongstagram/${profile.character_id}`} className="flex min-w-0 flex-1 items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300"><BongstagramProfileAvatar profileAvatarUrl={profile.avatar_url} streamerAvatarUrl={streamer?.profile_image_url} fallbackAvatarUrl={character?.avatar_url} profileName={profile.profile_name} streamerName={streamer?.display_name} className="h-full w-full object-cover" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-zinc-200"><BongstagramDisplayName profileName={profile.profile_name} streamerName={streamer?.display_name} /></p><p className="mt-0.5 truncate text-sm text-zinc-400">{isRedPill && streamer ? streamer.display_name : character?.name ?? '캐릭터 없음'}</p></div></Link><BongstagramFollowButton characterId={profile.character_id} /></div>)}</div>}</div></section></div>}

      <nav className="flex border-b border-zinc-800" aria-label="내 프로필 콘텐츠 탭"><button type="button" aria-label="게시물 보기" className="flex flex-1 justify-center border-b-2 border-white py-3 text-white"><Grid3X3 size={21} /></button><button type="button" onClick={() => setFollowingOpen(true)} aria-label="팔로잉 목록 보기" className="flex flex-1 cursor-pointer justify-center border-b-2 border-transparent py-3 text-zinc-600 transition-colors hover:text-zinc-300"><UsersRound size={21} /></button></nav>
      <section className="px-5 py-8"><p className="text-center text-sm text-zinc-600">내가 작성한 게시물이 여기에 표시됩니다.</p></section>
    </main>
  )
}
