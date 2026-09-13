import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPublicClient } from '@/lib/supabase/public'

export const BONGSTAGRAM_DIRECTORY_TAG = 'bongstagram-directory'
export const BONGSTAGRAM_POSTS_TAG = 'bongstagram-posts'
export const BONGSTAGRAM_PROFILES_TAG = 'bongstagram-profiles'
export const BONGSTAGRAM_ENGAGEMENT_TAG = 'bongstagram-engagement'

export type BongstagramDirectory = {
  profiles: { character_id: string; profile_name: string; avatar_url: string | null }[]
  characters: { id: string; name: string; avatar_url: string | null; streamer_id: string | null }[]
  streamers: { id: string; display_name: string; profile_image_url: string | null }[]
}

export type BongstagramPublicMedia = {
  id: string
  media_type: 'image' | 'video'
  media_url: string
  sort_order: number
  storage_path?: string | null
}

export type BongstagramPublicPost = {
  id: string
  character_id: string
  post_type: 'post' | 'story'
  content: string
  posted_at: string
  story_expires_at: string | null
  media: BongstagramPublicMedia[]
}

export type BongstagramPublicProfile = {
  character_id: string
  profile_name: string
  avatar_url: string | null
  bio: string | null
}

export type BongstagramPublicCharacter = {
  id: string
  streamer_id: string | null
  name: string
  avatar_url: string | null
}

export type BongstagramPublicStreamer = {
  display_name: string
  profile_image_url: string | null
} | null

export type BongstagramPublicComment = {
  id: string
  post_id: string
  parent_comment_id: string | null
  author_character_id: string | null
  author_name: string
  content: string
  created_at: string
  streamer_name: string | null
  profile_avatar_url: string | null
  streamer_avatar_url: string | null
}

type PostTypeFilter = 'all' | 'post' | 'story'

const getCachedDirectory = unstable_cache(
  async (): Promise<BongstagramDirectory> => {
    const supabase = createPublicClient()
    const [{ data: profiles }, { data: characters }, { data: streamers }] = await Promise.all([
      supabase.from('bongstagram_profiles').select('character_id, profile_name, avatar_url'),
      supabase.from('characters').select('id, name, avatar_url, streamer_id'),
      supabase.from('streamers').select('id, display_name, profile_image_url'),
    ])

    return {
      profiles: profiles ?? [],
      characters: characters ?? [],
      streamers: streamers ?? [],
    }
  },
  ['bongstagram-directory'],
  { revalidate: 60, tags: [BONGSTAGRAM_DIRECTORY_TAG] },
)

export function getBongstagramDirectory() {
  return getCachedDirectory()
}

const getCachedPosts = unstable_cache(
  async (postType: PostTypeFilter): Promise<BongstagramPublicPost[]> => {
    const supabase = createPublicClient()
    const query = supabase
      .from('bongstagram_posts')
      .select('id, character_id, post_type, content, posted_at, story_expires_at, bongstagram_post_media ( id, media_type, media_url, sort_order )')
      .order('posted_at', { ascending: false })
    const result = postType === 'all' ? await query : await query.eq('post_type', postType)

    return ((result.data ?? []) as {
      id: string
      character_id: string
      post_type: 'post' | 'story'
      content: string
      posted_at: string
      story_expires_at: string | null
      bongstagram_post_media: BongstagramPublicMedia[]
    }[]).map((post) => ({
      id: post.id,
      character_id: post.character_id,
      post_type: post.post_type,
      content: post.content,
      posted_at: post.posted_at,
      story_expires_at: post.story_expires_at,
      media: [...(post.bongstagram_post_media ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    }))
  },
  ['bongstagram-posts'],
  { revalidate: 60, tags: [BONGSTAGRAM_POSTS_TAG] },
)

export function getBongstagramPosts(postType: PostTypeFilter = 'all') {
  return getCachedPosts(postType)
}

const getCachedProfile = unstable_cache(
  async (characterId: string): Promise<{
    profile: BongstagramPublicProfile
    character: BongstagramPublicCharacter
    streamer: BongstagramPublicStreamer
    posts: BongstagramPublicPost[]
  } | null> => {
    const supabase = createPublicClient()
    const [{ data: profile }, { data: character }, { data: posts }] = await Promise.all([
      supabase.from('bongstagram_profiles').select('character_id, profile_name, avatar_url, bio').eq('character_id', characterId).maybeSingle(),
      supabase.from('characters').select('id, streamer_id, name, avatar_url').eq('id', characterId).maybeSingle(),
      supabase
        .from('bongstagram_posts')
        .select('id, character_id, post_type, content, posted_at, story_expires_at, bongstagram_post_media ( id, media_type, media_url, sort_order )')
        .eq('character_id', characterId)
        .order('posted_at', { ascending: false }),
    ])

    if (!profile || !character) return null

    const profileRow = profile as unknown as BongstagramPublicProfile
    const characterRow = character as unknown as BongstagramPublicCharacter
    const streamer = characterRow.streamer_id
      ? (await supabase.from('streamers').select('display_name, profile_image_url').eq('id', characterRow.streamer_id).maybeSingle()).data
      : null

    return {
      profile: profileRow,
      character: characterRow,
      streamer: streamer as BongstagramPublicStreamer,
      posts: ((posts ?? []) as {
        id: string
        character_id: string
        post_type: 'post' | 'story'
        content: string
        posted_at: string
        story_expires_at: string | null
        bongstagram_post_media: BongstagramPublicMedia[]
      }[]).map((post) => ({
        id: post.id,
        character_id: post.character_id,
        post_type: post.post_type,
        content: post.content,
        posted_at: post.posted_at,
        story_expires_at: post.story_expires_at,
        media: [...(post.bongstagram_post_media ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      })),
    }
  },
  ['bongstagram-profile'],
  { revalidate: 60, tags: [BONGSTAGRAM_PROFILES_TAG, BONGSTAGRAM_POSTS_TAG] },
)

export function getBongstagramProfile(characterId: string) {
  return getCachedProfile(characterId)
}

const getCachedPost = unstable_cache(
  async (postId: string): Promise<{
    post: BongstagramPublicPost
    profile: BongstagramPublicProfile
    character: BongstagramPublicCharacter
    streamer: BongstagramPublicStreamer
  } | null> => {
    const supabase = createPublicClient()
    const { data: post } = await supabase
      .from('bongstagram_posts')
      .select('id, character_id, post_type, content, posted_at, story_expires_at, bongstagram_post_media ( id, media_type, media_url, sort_order )')
      .eq('id', postId)
      .eq('post_type', 'post')
      .maybeSingle()

    if (!post) return null

    const postRow = post as unknown as {
      id: string
      character_id: string
      post_type: 'post' | 'story'
      content: string
      posted_at: string
      story_expires_at: string | null
      bongstagram_post_media: BongstagramPublicMedia[]
    }
    const [{ data: profile }, { data: character }] = await Promise.all([
      supabase.from('bongstagram_profiles').select('character_id, profile_name, avatar_url, bio').eq('character_id', postRow.character_id).maybeSingle(),
      supabase.from('characters').select('id, streamer_id, name, avatar_url').eq('id', postRow.character_id).maybeSingle(),
    ])

    if (!profile || !character) return null

    const profileRow = profile as unknown as BongstagramPublicProfile
    const characterRow = character as unknown as BongstagramPublicCharacter
    const streamer = characterRow.streamer_id
      ? (await supabase.from('streamers').select('display_name, profile_image_url').eq('id', characterRow.streamer_id).maybeSingle()).data
      : null

    return {
      post: {
        id: postRow.id,
        character_id: postRow.character_id,
        post_type: postRow.post_type,
        content: postRow.content,
        posted_at: postRow.posted_at,
        story_expires_at: postRow.story_expires_at,
        media: [...(postRow.bongstagram_post_media ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      },
      profile: profileRow,
      character: characterRow,
      streamer: streamer as BongstagramPublicStreamer,
    }
  },
  ['bongstagram-post'],
  { revalidate: 60, tags: [BONGSTAGRAM_POSTS_TAG, BONGSTAGRAM_PROFILES_TAG] },
)

export function getBongstagramPost(postId: string) {
  return getCachedPost(postId)
}

const getCachedComments = unstable_cache(
  async (postId: string): Promise<{ comments: BongstagramPublicComment[]; errorCode?: string; errorMessage?: string }> => {
    const supabase = createAdminClient()
    const [{ data: comments, error }, { data: profiles }, { data: characters }, { data: streamers }] = await Promise.all([
      supabase
        .from('bongstagram_post_comments')
        .select('id, post_id, parent_comment_id, author_character_id, author_name, content, created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: true }),
      supabase.from('bongstagram_profiles').select('profile_name, character_id, avatar_url'),
      supabase.from('characters').select('id, streamer_id, avatar_url'),
      supabase.from('streamers').select('id, display_name, profile_image_url'),
    ])

    if (error) return { comments: [], errorCode: error.code, errorMessage: error.message }

    type CommentRow = Omit<BongstagramPublicComment, 'streamer_name' | 'profile_avatar_url' | 'streamer_avatar_url'>
    type ProfileRow = { profile_name: string; character_id: string; avatar_url: string | null }
    type CharacterRow = { id: string; streamer_id: string | null; avatar_url: string | null }
    type StreamerRow = { id: string; display_name: string; profile_image_url: string | null }
    const profileRows = (profiles ?? []) as unknown as ProfileRow[]
    const characterRows = (characters ?? []) as unknown as CharacterRow[]
    const streamerRows = (streamers ?? []) as unknown as StreamerRow[]
    const profileByName = new Map(profileRows.map((profile) => [profile.profile_name, profile]))
    const characterById = new Map(characterRows.map((character) => [character.id, character]))
    const streamerById = new Map(streamerRows.map((streamer) => [streamer.id, streamer]))

    const commentRows = (comments ?? []) as unknown as CommentRow[]
    return {
      comments: commentRows.map((comment) => {
        const profile = comment.author_character_id
          ? profileRows.find((item) => item.character_id === comment.author_character_id) ?? null
          : profileByName.get(comment.author_name) ?? null
        const character = profile ? characterById.get(profile.character_id) : null
        const streamer = character?.streamer_id ? streamerById.get(character.streamer_id) : null
        return {
          ...comment,
          streamer_name: streamer?.display_name ?? null,
          profile_avatar_url: profile?.avatar_url ?? null,
          streamer_avatar_url: streamer?.profile_image_url ?? null,
        }
      }),
    }
  },
  ['bongstagram-comments'],
  { revalidate: 60, tags: [BONGSTAGRAM_ENGAGEMENT_TAG] },
)

export function getBongstagramComments(postId: string) {
  return getCachedComments(postId)
}

export async function getBongstagramPostEngagement(postIds: string[]) {
  const ids = Array.from(new Set(postIds)).sort()
  if (ids.length === 0) return { likeCounts: {}, commentCounts: {} }
  return getCachedEngagement(ids.join(','))
}

const getCachedEngagement = unstable_cache(
  async (postIdsKey: string) => {
    const postIds = postIdsKey.split(',').filter(Boolean)
    const supabase = createAdminClient()
    const [likesResult, commentsResult] = await Promise.all([
      supabase.from('bongstagram_post_likes').select('post_id').in('post_id', postIds),
      supabase.from('bongstagram_post_comments').select('post_id').in('post_id', postIds),
    ])

    const likeCounts: Record<string, number> = Object.fromEntries(postIds.map((postId) => [postId, 0]))
    const commentCounts: Record<string, number> = Object.fromEntries(postIds.map((postId) => [postId, 0]))
    for (const row of (likesResult.data ?? []) as { post_id: string }[]) likeCounts[row.post_id] = (likeCounts[row.post_id] ?? 0) + 1
    for (const row of (commentsResult.data ?? []) as { post_id: string }[]) commentCounts[row.post_id] = (commentCounts[row.post_id] ?? 0) + 1

    return { likeCounts, commentCounts }
  },
  ['bongstagram-engagement'],
  { revalidate: 60, tags: [BONGSTAGRAM_ENGAGEMENT_TAG] },
)
