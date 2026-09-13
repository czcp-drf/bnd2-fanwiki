import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBongstagramIpHash } from '@/lib/bongstagram/like-ip'
import { isStoryVisible } from '@/lib/bongstagram/story-schedule'
import BongstagramBottomNav from '../BongstagramBottomNav'
import BongstagramProfileScreen from '../BongstagramProfileScreen'

type Media = {
  id: string
  media_type: 'image' | 'video'
  media_url: string
  sort_order: number
}

type ProfilePost = {
  id: string
  post_type: 'post' | 'story'
  content: string
  posted_at: string
  story_expires_at: string | null
  media: Media[]
  liked_by_viewer?: boolean
  is_active_story: boolean
}

async function getProfileData(characterId: string) {
  const supabase = await createClient()
  const [{ data: profile }, { data: character }, { data: posts }] = await Promise.all([
    supabase
      .from('bongstagram_profiles')
      .select('character_id, profile_name, avatar_url, bio')
      .eq('character_id', characterId)
      .maybeSingle(),
    supabase
      .from('characters')
      .select('id, streamer_id, name, avatar_url')
      .eq('id', characterId)
      .maybeSingle(),
    supabase
      .from('bongstagram_posts')
      .select('id, post_type, content, posted_at, story_expires_at, bongstagram_post_media ( id, media_type, media_url, sort_order )')
      .eq('character_id', characterId)
      .order('posted_at', { ascending: false }),
  ])

  if (!profile || !character) notFound()

  type ProfileRow = { character_id: string; profile_name: string; avatar_url: string | null; bio: string | null }
  type CharacterRow = { id: string; streamer_id: string | null; name: string; avatar_url: string | null }
  type PostRow = Omit<ProfilePost, 'media'> & { bongstagram_post_media: Media[] }
  const profileRow = profile as ProfileRow
  const characterRow = character as CharacterRow
  const { data: streamer } = characterRow.streamer_id
    ? await supabase.from('streamers').select('display_name, profile_image_url').eq('id', characterRow.streamer_id).maybeSingle()
    : { data: null }

  const profilePosts: ProfilePost[] = ((posts ?? []) as PostRow[]).map((post) => ({
    id: post.id,
    post_type: post.post_type,
    content: post.content,
    posted_at: post.posted_at,
    story_expires_at: post.story_expires_at,
    media: post.bongstagram_post_media.sort((a, b) => a.sort_order - b.sort_order),
    is_active_story: post.post_type === 'story' && isStoryVisible(post.posted_at),
  }))
  const storyIds = profilePosts.filter((post) => post.post_type === 'story').map((post) => post.id)
  let likedStoryIds = new Set<string>()

  if (storyIds.length > 0) {
    const adminSupabase = createAdminClient()
    const ipHash = await getBongstagramIpHash()
    const viewerLikesResult = ipHash
      ? await adminSupabase.from('bongstagram_story_likes').select('story_id').in('story_id', storyIds).eq('ip_hash', ipHash)
      : { data: [], error: null }

    if (viewerLikesResult.error && viewerLikesResult.error.code !== 'PGRST205') {
      console.error('Bongstagram profile story viewer like lookup failed:', viewerLikesResult.error.code, viewerLikesResult.error.message)
    }

    likedStoryIds = new Set(((viewerLikesResult.data ?? []) as { story_id: string }[]).map((row) => row.story_id))
  }

  return {
    profile: profileRow,
    character: characterRow,
    streamer: streamer as { display_name: string; profile_image_url: string | null } | null,
    posts: profilePosts.map((post) => ({
      ...post,
      liked_by_viewer: likedStoryIds.has(post.id),
    })),
  }
}

export async function generateMetadata({ params }: { params: Promise<{ characterId: string }> }): Promise<Metadata> {
  const { characterId } = await params
  const data = await getProfileData(characterId)
  return { title: `${data.profile.profile_name} · Bongstagram` }
}

export default async function BongstagramProfilePage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = await params
  const data = await getProfileData(characterId)

  return (
    <div className="bongstagram-theme">
      <div className="bongstagram-font min-h-screen bg-zinc-950 pb-20">
        <div className="mx-auto min-h-screen w-full max-w-[540px] border-x border-zinc-900 bg-zinc-950">
          <BongstagramProfileScreen profile={data.profile} character={data.character} streamer={data.streamer} posts={data.posts} />
        </div>
      </div>
      <BongstagramBottomNav />
    </div>
  )
}
