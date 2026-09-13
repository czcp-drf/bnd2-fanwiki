'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBongstagramIpHash } from '@/lib/bongstagram/like-ip'
import { getBongstagramComments as getCachedBongstagramComments } from '@/lib/bongstagram/public-data'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type BongstagramComment = {
  id: string
  post_id: string
  parent_comment_id: string | null
  author_character_id: string | null
  author_name: string
  content: string
  created_at: string
  streamer_name?: string | null
  profile_avatar_url?: string | null
  streamer_avatar_url?: string | null
}

type LikeActionResult = {
  success?: true
  liked?: boolean
  error?: string
}

type StoryLikeActionResult = {
  success?: true
  liked?: boolean
  error?: string
}

type LikeCountsResult = {
  counts?: Record<string, number>
  error?: string
}

function isValidPostId(postId: string) {
  return UUID_PATTERN.test(postId.trim())
}

export async function toggleBongstagramLike(postId: string): Promise<LikeActionResult> {
  const id = postId.trim()
  if (!isValidPostId(id)) return { error: '좋아요를 처리할 게시물을 찾을 수 없습니다.' }

  const ipHash = await getBongstagramIpHash()
  if (!ipHash) return { error: '접속 환경을 확인할 수 없어 좋아요를 처리할 수 없습니다.' }

  const supabase = createAdminClient()
  const { data: post, error: postError } = await supabase
    .from('bongstagram_posts')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (postError) {
    console.error('Bongstagram like post lookup failed:', postError.code, postError.message)
    return { error: postError.code === 'PGRST205' ? '좋아요 테이블이 아직 연결되지 않았습니다. migration 023을 적용해 주세요.' : '게시물을 확인하지 못했습니다.' }
  }
  if (!post) return { error: '게시물을 찾을 수 없습니다.' }

  const { data: existing, error: existingError } = await supabase
    .from('bongstagram_post_likes')
    .select('id')
    .eq('post_id', id)
    .eq('ip_hash', ipHash)
    .maybeSingle()

  if (existingError) {
    console.error('Bongstagram like lookup failed:', existingError.code, existingError.message)
    return { error: existingError.code === 'PGRST205' ? '좋아요 테이블이 아직 연결되지 않았습니다. migration 023을 적용해 주세요.' : '좋아요 상태를 확인하지 못했습니다.' }
  }

  let liked: boolean
  if (existing) {
    const { error } = await supabase.from('bongstagram_post_likes').delete().eq('id', existing.id)
    if (error) {
      console.error('Bongstagram unlike failed:', error.code, error.message)
      return { error: '좋아요를 취소하지 못했습니다.' }
    }
    liked = false
  } else {
    const { error } = await supabase.from('bongstagram_post_likes').insert({ post_id: id, ip_hash: ipHash })
    if (error && error.code !== '23505') {
      console.error('Bongstagram like failed:', error.code, error.message)
      return { error: '좋아요를 등록하지 못했습니다.' }
    }
    liked = true
  }

  revalidatePath('/bongstagram')
  return { success: true, liked }
}

export async function getBongstagramLikeCounts(postIds: string[]): Promise<LikeCountsResult> {
  const ids = Array.from(new Set(postIds.map((postId) => postId.trim()).filter(isValidPostId))).slice(0, 100)
  if (ids.length === 0) return { counts: {} }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('bongstagram_post_likes')
    .select('post_id')
    .in('post_id', ids)

  if (error) {
    console.error('Bongstagram like counts refresh failed:', error.code, error.message)
    return { error: error.code === 'PGRST205' ? '좋아요 테이블이 아직 연결되지 않았습니다. migration 023을 적용해 주세요.' : '좋아요 수를 갱신하지 못했습니다.' }
  }

  const counts = Object.fromEntries(ids.map((id) => [id, 0]))
  for (const row of (data ?? []) as { post_id: string }[]) {
    counts[row.post_id] = (counts[row.post_id] ?? 0) + 1
  }
  return { counts }
}

export async function toggleBongstagramStoryLike(storyId: string): Promise<StoryLikeActionResult> {
  const id = storyId.trim()
  if (!isValidPostId(id)) return { error: '좋아요를 처리할 스토리를 찾을 수 없습니다.' }

  const ipHash = await getBongstagramIpHash()
  if (!ipHash) return { error: '접속 환경을 확인할 수 없어 좋아요를 처리할 수 없습니다.' }

  const supabase = createAdminClient()
  const { data: story, error: storyError } = await supabase
    .from('bongstagram_posts')
    .select('id, character_id')
    .eq('id', id)
    .eq('post_type', 'story')
    .maybeSingle()

  if (storyError) {
    console.error('Bongstagram story like lookup failed:', storyError.code, storyError.message)
    return { error: storyError.code === 'PGRST205' ? '스토리 좋아요 테이블이 아직 연결되지 않았습니다. migration 026을 적용해 주세요.' : '스토리를 확인하지 못했습니다.' }
  }
  if (!story) return { error: '스토리를 찾을 수 없습니다.' }

  const { data: existing, error: existingError } = await supabase
    .from('bongstagram_story_likes')
    .select('id')
    .eq('story_id', id)
    .eq('ip_hash', ipHash)
    .maybeSingle()

  if (existingError) {
    console.error('Bongstagram story like lookup failed:', existingError.code, existingError.message)
    return { error: existingError.code === 'PGRST205' ? '스토리 좋아요 테이블이 아직 연결되지 않았습니다. migration 026을 적용해 주세요.' : '스토리 좋아요 상태를 확인하지 못했습니다.' }
  }

  let liked: boolean
  if (existing) {
    const { error } = await supabase.from('bongstagram_story_likes').delete().eq('id', existing.id)
    if (error) {
      console.error('Bongstagram story unlike failed:', error.code, error.message)
      return { error: '스토리 좋아요를 취소하지 못했습니다.' }
    }
    liked = false
  } else {
    const { error } = await supabase.from('bongstagram_story_likes').insert({ story_id: id, ip_hash: ipHash })
    if (error && error.code !== '23505') {
      console.error('Bongstagram story like failed:', error.code, error.message)
      return { error: '스토리 좋아요를 등록하지 못했습니다.' }
    }
    liked = true
  }

  revalidatePath('/bongstagram')
  revalidatePath(`/bongstagram/${story.character_id}`)
  return { success: true, liked }
}

export async function getBongstagramComments(postId: string): Promise<{ comments?: BongstagramComment[]; error?: string }> {
  const id = postId.trim()
  if (!isValidPostId(id)) return { error: '댓글을 불러올 게시물을 찾을 수 없습니다.' }

  const result = await getCachedBongstagramComments(id)
  if (result.errorCode) {
    console.error('Bongstagram comments lookup failed:', result.errorCode, result.errorMessage)
    return { error: result.errorCode === 'PGRST205' ? '댓글 테이블이 아직 연결되지 않았습니다. migration 023을 적용해 주세요.' : '댓글을 불러오지 못했습니다.' }
  }

  return { comments: result.comments }
}
