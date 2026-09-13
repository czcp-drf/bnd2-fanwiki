'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBongstagramIpHash } from '@/lib/bongstagram/like-ip'

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
  likeCount?: number
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

  const { count, error: countError } = await supabase
    .from('bongstagram_post_likes')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', id)

  if (countError) {
    console.error('Bongstagram like count failed:', countError.code, countError.message)
    return { success: true, liked, likeCount: 0 }
  }

  revalidatePath('/bongstagram')
  return { success: true, liked, likeCount: count ?? 0 }
}

export async function getBongstagramComments(postId: string): Promise<{ comments?: BongstagramComment[]; error?: string }> {
  const id = postId.trim()
  if (!isValidPostId(id)) return { error: '댓글을 불러올 게시물을 찾을 수 없습니다.' }

  const supabase = createAdminClient()
  const [{ data, error }, { data: profiles }, { data: characters }, { data: streamers }] = await Promise.all([
    supabase
      .from('bongstagram_post_comments')
      .select('id, post_id, parent_comment_id, author_character_id, author_name, content, created_at')
      .eq('post_id', id)
      .order('created_at', { ascending: true }),
    supabase.from('bongstagram_profiles').select('profile_name, character_id, avatar_url'),
    supabase.from('characters').select('id, streamer_id, avatar_url'),
    supabase.from('streamers').select('id, display_name, profile_image_url'),
  ])

  if (error) {
    console.error('Bongstagram comments lookup failed:', error.code, error.message)
    return { error: error.code === 'PGRST205' ? '댓글 테이블이 아직 연결되지 않았습니다. migration 023을 적용해 주세요.' : '댓글을 불러오지 못했습니다.' }
  }

  type CommentRow = Omit<BongstagramComment, 'streamer_name' | 'profile_avatar_url' | 'streamer_avatar_url'>
  type ProfileRow = { profile_name: string; character_id: string; avatar_url: string | null }
  type CharacterRow = { id: string; streamer_id: string | null; avatar_url: string | null }
  type StreamerRow = { id: string; display_name: string; profile_image_url: string | null }
  const profileByName = new Map(((profiles ?? []) as ProfileRow[]).map((profile) => [profile.profile_name, profile]))
  const characterById = new Map(((characters ?? []) as CharacterRow[]).map((character) => [character.id, character]))
  const streamerById = new Map(((streamers ?? []) as StreamerRow[]).map((streamer) => [streamer.id, streamer]))

  const comments = ((data ?? []) as CommentRow[]).map((comment) => {
    const profile = comment.author_character_id
      ? ((profiles ?? []) as ProfileRow[]).find((item) => item.character_id === comment.author_character_id) ?? null
      : profileByName.get(comment.author_name)
    const character = profile ? characterById.get(profile.character_id) : null
    const streamer = character?.streamer_id ? streamerById.get(character.streamer_id) : null
    return {
      ...comment,
      streamer_name: streamer?.display_name ?? null,
      profile_avatar_url: profile?.avatar_url ?? null,
      streamer_avatar_url: streamer?.profile_image_url ?? null,
    }
  })

  return { comments }
}
