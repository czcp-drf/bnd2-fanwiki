export const revalidate = 86400

import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { WIKI_CACHE_REVALIDATE, WIKI_CACHE_TAGS, WIKI_PUBLIC_TAG } from '@/lib/cache/wiki'
import type { Metadata } from 'next'
import CharactersClientSection from '@/components/characters/CharactersClientSection'
import type { Character, Streamer, Organization } from '@/types/database'
import { getOrganizationFilterOptions, type OrganizationFilterOption } from '@/lib/data/organizations'

export const metadata: Metadata = {
  title: '캐릭터 위키',
  description: '봉누도2 서버의 모든 RP 캐릭터 정보',
}

type CharacterWithRelations = Character & {
  streamers: Pick<Streamer, 'id' | 'display_name' | 'chzzk_channel_id' | 'profile_image_url'> | null
  organization_members: Array<{
    is_primary: boolean
    role: string | null
    organizations: Pick<Organization, 'id' | 'name' | 'color'> | null
  }>
}

async function getAllCharacters() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('characters')
    .select(`
      *,
      streamers ( id, display_name, chzzk_channel_id, profile_image_url ),
      organization_members (
        is_primary,
        role,
        organizations ( id, name, color )
      )
    `)
    .order('name')

  return (data ?? []) as unknown as CharacterWithRelations[]
}

const getAllCharactersCached = unstable_cache(getAllCharacters, ['wiki-characters-list'], {
  revalidate: WIKI_CACHE_REVALIDATE,
  tags: [WIKI_PUBLIC_TAG, WIKI_CACHE_TAGS.characters, WIKI_CACHE_TAGS.organizations],
})

export default async function CharactersPage() {
  const [organizations, allCharacters]: [OrganizationFilterOption[], CharacterWithRelations[]] = await Promise.all([
    getOrganizationFilterOptions(),
    getAllCharactersCached(),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      {/* 헤더 */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-white">캐릭터 위키</h1>
        <p className="text-sm text-zinc-500">
          봉누도2 서버에 등장하는 RP 캐릭터 정보입니다.
        </p>
      </div>

      <Suspense>
        <CharactersClientSection
          allCharacters={allCharacters}
          organizations={organizations}
        />
      </Suspense>
    </div>
  )
}
