import { createClient } from '@/lib/supabase/server'
import type { StreamerItem } from '@/components/streamers/StreamerListWithLive'

type LiveCharacter = StreamerItem['characters'][number] & {
  organization_members: Array<{
    organizations: { id: string; name: string; color: string | null } | null
  }>
}

type LiveStreamer = Omit<StreamerItem, 'characters'> & {
  characters: LiveCharacter[]
}

type OrganizationMember = LiveCharacter['organization_members'][number]

export async function getLiveStreamers(orgId = '', sort = 'name'): Promise<StreamerItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('streamers')
    .select(`
      id,
      display_name,
      profile_image_url,
      chzzk_channel_id,
      is_active,
      characters (
        id,
        name,
        avatar_url,
        job,
        status
      )
    `)
    .eq('is_active', true)
    .order(
      sort === 'latest' || sort === 'oldest' ? 'created_at' : 'display_name',
      { ascending: sort === 'name' || sort === 'oldest' }
    )

  if (error) {
    console.error('Failed to load live streamers:', error.message)
    throw new Error('스트리머 목록을 불러오지 못했습니다.')
  }

  const rawStreamers = (data ?? []) as unknown as Array<Omit<LiveStreamer, 'characters'> & {
    characters: Omit<LiveCharacter, 'organization_members'>[]
  }>
  const characterIds = rawStreamers.flatMap((streamer) => streamer.characters.map((character) => character.id))
  const organizationMembers = new Map<string, OrganizationMember[]>()

  if (characterIds.length > 0) {
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('character_id, organizations ( id, name, color )')
      .in('character_id', characterIds)
      .is('left_at', null)

    if (membersError) {
      console.error('Failed to load live streamer organizations:', membersError.message)
      throw new Error('소속 정보를 불러오지 못했습니다.')
    } else {
      for (const member of (members ?? []) as unknown as Array<OrganizationMember & { character_id: string }>) {
        const current = organizationMembers.get(member.character_id) ?? []
        current.push(member)
        organizationMembers.set(member.character_id, current)
      }
    }
  }

  let streamers = rawStreamers.map(({ characters, ...streamer }) => ({
    ...streamer,
    characters: characters.filter((character) => character.status === 'active').map((character) => ({
      ...character,
      organization_members: organizationMembers.get(character.id) ?? [],
    })),
  })) as LiveStreamer[]

  if (orgId === '__none__') {
    streamers = streamers.filter((streamer) =>
      streamer.characters.every((character) => character.organization_members.length === 0)
    )
  } else if (orgId) {
    streamers = streamers.filter((streamer) =>
      streamer.characters.some((character) =>
        character.organization_members.some((member) => member.organizations?.id === orgId)
      )
    )
  }

  return streamers.map(({ characters, ...streamer }) => ({
    ...streamer,
    characters: characters.map((character) => ({
      id: character.id,
      name: character.name,
      avatar_url: character.avatar_url,
      job: character.job,
      status: character.status,
      organizations: character.organization_members
        .map((member) => member.organizations)
        .filter((organization): organization is NonNullable<typeof organization> => organization !== null),
    })),
  }))
}
