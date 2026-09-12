import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import BongstagramProfileManager from './BongstagramProfileManager'

export const metadata: Metadata = { title: 'Bongstagram 관리' }

async function getBongstagramData() {
  const supabase = createAdminClient()
  const [{ data: characters }, { data: profiles }, { data: organizations }] = await Promise.all([
    supabase
      .from('characters')
      .select('id, name, job, status, avatar_url, streamers ( display_name ), organization_members ( organization_id, is_primary, organizations ( id, name, color, category ) )')
      .order('name'),
    supabase
      .from('bongstagram_profiles')
      .select('character_id, profile_name, avatar_url, bio, created_at, updated_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('organizations')
      .select('id, name, color, category')
      .eq('is_active', true)
      .order('category')
      .order('name'),
  ])

  type OrganizationRow = {
    id: string
    name: string
    color: string | null
    category: string | null
  }

  type CharacterRow = {
    id: string
    name: string
    job: string | null
    status: string
    avatar_url: string | null
    streamers: { display_name: string } | null
    organization_members: {
      organization_id: string
      is_primary: boolean
      organizations: OrganizationRow | null
    }[]
  }

  type ProfileRow = {
    character_id: string
    profile_name: string
    avatar_url: string | null
    bio: string | null
    created_at: string
    updated_at: string
  }

  return {
    characters: (characters ?? []) as unknown as CharacterRow[],
    profiles: (profiles ?? []) as unknown as ProfileRow[],
    organizations: (organizations ?? []) as OrganizationRow[],
  }
}

export default async function AdminBongstagramPage() {
  const { characters, profiles, organizations } = await getBongstagramData()
  const profileIds = new Set(profiles.map((profile) => profile.character_id))

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-xl font-black text-white">Bongstagram 관리</h1>
        <p className="mt-1 text-sm text-zinc-500">기존 캐릭터에 Bongstagram 프로필을 연결하고 관리합니다.</p>
      </div>

      <BongstagramProfileManager
        characters={characters}
        profiles={profiles}
        organizations={organizations}
        availableCharacterIds={characters.filter((character) => !profileIds.has(character.id)).map((character) => character.id)}
      />
    </div>
  )
}
