import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBongstagramIpHash } from '@/lib/bongstagram/like-ip'
import { getBongstagramProfile } from '@/lib/bongstagram/public-data'
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
  const data = await getBongstagramProfile(characterId)
  if (!data) notFound()

  const profilePosts: ProfilePost[] = data.posts.map((post) => ({
    id: post.id,
    post_type: post.post_type,
    content: post.content,
    posted_at: post.posted_at,
    story_expires_at: post.story_expires_at,
    media: post.media,
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
    profile: data.profile,
    character: data.character,
    streamer: data.streamer,
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
