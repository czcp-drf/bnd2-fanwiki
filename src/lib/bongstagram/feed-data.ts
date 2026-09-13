import { createAdminClient } from '@/lib/supabase/admin'
import { getBongstagramIpHash } from '@/lib/bongstagram/like-ip'
import {
  getBongstagramDirectory,
  getBongstagramActiveStories,
  getBongstagramPostEngagement,
  getBongstagramPostsPage,
} from '@/lib/bongstagram/public-data'
import { isStoryVisible } from '@/lib/bongstagram/story-schedule'
import type { BongstagramFeedPost, BongstagramPostCursor } from '@/lib/bongstagram/types'
import { extractBongstagramHashtags } from '@/lib/bongstagram/hashtags'
import { getBongstagramLikeMode } from '@/lib/bongstagram/like-mode'

const FEED_PAGE_SIZE = 12
const GRID_PAGE_SIZE = 24

function createDirectoryMaps(directory: Awaited<ReturnType<typeof getBongstagramDirectory>>) {
  return {
    profilesByCharacterId: new Map(directory.profiles.map((profile) => [profile.character_id, profile])),
    charactersById: new Map(directory.characters.map((character) => [character.id, character])),
    streamersById: new Map(directory.streamers.map((streamer) => [streamer.id, streamer])),
  }
}

function mapFeedPost(
  post: Awaited<ReturnType<typeof getBongstagramPostsPage>>['posts'][number],
  maps: ReturnType<typeof createDirectoryMaps>,
): BongstagramFeedPost | null {
  const profile = maps.profilesByCharacterId.get(post.character_id)
  const character = maps.charactersById.get(post.character_id)
  if (!profile || !character) return null

  const streamer = character.streamer_id ? maps.streamersById.get(character.streamer_id) : null
  return {
    id: post.id,
    character_id: post.character_id,
    post_type: post.post_type,
    content: post.content,
    posted_at: post.posted_at,
    story_expires_at: post.story_expires_at,
    media: post.media,
    profile_name: profile.profile_name,
    profile_avatar_url: profile.avatar_url,
    character_name: character.name,
    character_avatar_url: character.avatar_url,
    streamer_name: streamer?.display_name ?? null,
    streamer_avatar_url: streamer?.profile_image_url ?? null,
  }
}

async function getViewerPostLikeIds(postIds: string[]) {
  if (postIds.length === 0 || getBongstagramLikeMode() === 'local') return new Set<string>()
  const ipHash = await getBongstagramIpHash()
  if (!ipHash) return new Set<string>()

  const supabase = createAdminClient()
  const result = await supabase
    .from('bongstagram_post_likes')
    .select('post_id')
    .in('post_id', postIds)
    .eq('ip_hash', ipHash)
  return new Set(((result.data ?? []) as { post_id: string }[]).map((row) => row.post_id))
}

export async function getBongstagramFeedPage(cursor?: BongstagramPostCursor | null, limit = FEED_PAGE_SIZE) {
  const [{ profiles, characters, streamers }, page] = await Promise.all([
    getBongstagramDirectory(),
    getBongstagramPostsPage('post', cursor, limit),
  ])
  const maps = createDirectoryMaps({ profiles, characters, streamers })
  const posts = page.posts.flatMap((post) => {
    const mapped = mapFeedPost(post, maps)
    return mapped ? [mapped] : []
  })
  const postIds = posts.map((post) => post.id)
  const [{ likeCounts, commentCounts }, likedPostIds] = await Promise.all([
    getBongstagramPostEngagement(postIds),
    getViewerPostLikeIds(postIds),
  ])

  return {
    posts: posts.map((post) => ({
      ...post,
      like_count: likeCounts[post.id] ?? 0,
      comment_count: commentCounts[post.id] ?? 0,
      liked_by_viewer: likedPostIds.has(post.id),
    })),
    nextCursor: page.nextCursor,
    hasMore: page.hasMore,
  }
}

async function getViewerStoryLikeIds(storyIds: string[]) {
  if (storyIds.length === 0 || getBongstagramLikeMode() === 'local') return new Set<string>()
  const ipHash = await getBongstagramIpHash()
  if (!ipHash) return new Set<string>()

  const supabase = createAdminClient()
  const result = await supabase
    .from('bongstagram_story_likes')
    .select('story_id')
    .in('story_id', storyIds)
    .eq('ip_hash', ipHash)
  if (result.error && result.error.code !== 'PGRST205') {
    console.error('Bongstagram story viewer like lookup failed:', result.error.code, result.error.message)
  }
  return new Set(((result.data ?? []) as { story_id: string }[]).map((row) => row.story_id))
}

export async function getBongstagramStoryFeed() {
  const [{ profiles, characters, streamers }, storyPosts] = await Promise.all([
    getBongstagramDirectory(),
    getBongstagramActiveStories(),
  ])
  const maps = createDirectoryMaps({ profiles, characters, streamers })
  const stories = storyPosts.flatMap((post) => {
    if (!isStoryVisible(post.posted_at)) return []
    const mapped = mapFeedPost(post, maps)
    return mapped ? [mapped] : []
  })
  const likedStoryIds = await getViewerStoryLikeIds(stories.map((story) => story.id))
  return stories.map((story) => ({ ...story, liked_by_viewer: likedStoryIds.has(story.id) }))
}

type BongstagramGridPost = {
  id: string
  character_id: string
  media_type: 'image' | 'video'
  media_url: string
}

function toGridPosts(posts: Awaited<ReturnType<typeof getBongstagramPostsPage>>['posts']) {
  return posts.flatMap((post): BongstagramGridPost[] => {
    const media = post.media[0]
    return media ? [{ id: post.id, character_id: post.character_id, media_type: media.media_type, media_url: media.media_url }] : []
  })
}

export async function getBongstagramPostGridPage(cursor?: BongstagramPostCursor | null) {
  const page = await getBongstagramPostsPage('post', cursor, GRID_PAGE_SIZE)
  return { posts: toGridPosts(page.posts), nextCursor: page.nextCursor, hasMore: page.hasMore }
}

export async function getBongstagramHashtagGridPage(tag: string, cursor?: BongstagramPostCursor | null) {
  const normalizedTag = tag.trim().replace(/^#/, '').toLocaleLowerCase()
  const page = await getBongstagramPostsPage('post', cursor, GRID_PAGE_SIZE)
  const posts = page.posts.filter((post) => extractBongstagramHashtags(post.content).some((item) => item.toLocaleLowerCase() === normalizedTag))
  return { posts: toGridPosts(posts), nextCursor: page.nextCursor, hasMore: page.hasMore }
}
