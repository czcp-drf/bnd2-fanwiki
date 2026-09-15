import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBongstagramIpHash } from '@/lib/bongstagram/like-ip'
import { getBbsReactionMode, type BbsReactionMode } from './reaction-mode'
import { BBS_ARTICLE_COMMENT_COUNTS_TAG, getBbsArticleTag } from './data'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type BbsArticleReaction = 'like' | 'dislike'

export type BbsArticleComment = {
  id: string
  authorCharacterId: string | null
  authorName: string
  characterName: string | null
  characterAvatarUrl: string | null
  streamerName: string | null
  streamerAvatarUrl: string | null
  content: string
  createdAt: string
}

export type BbsArticleEngagement = {
  likeCount: number
  dislikeCount: number
  commentCount: number
  viewerReaction: BbsArticleReaction | null
  reactionMode: BbsReactionMode
}

function isValidArticleId(articleId: string) {
  return UUID_PATTERN.test(articleId.trim())
}

function getCachedBbsCommentCount(articleId: string) {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const result = await supabase.from('bbs_article_comments').select('id', { count: 'exact', head: true }).eq('article_id', articleId)
      if (result.error) console.error('BBS article comment count load failed:', result.error.message)
      return result.count ?? 0
    },
    ['bbs-article-comment-count', articleId],
    { revalidate: 60 * 60 * 24, tags: [BBS_ARTICLE_COMMENT_COUNTS_TAG, getBbsArticleTag(articleId)] },
  )()
}

export async function getBbsArticleEngagement(articleId: string): Promise<BbsArticleEngagement> {
  const id = articleId.trim()
  const reactionMode = getBbsReactionMode()
  if (!isValidArticleId(id)) return { likeCount: 0, dislikeCount: 0, commentCount: 0, viewerReaction: null, reactionMode }

  const supabase = createAdminClient()
    const commentCountPromise = getCachedBbsCommentCount(id)
  if (reactionMode === 'local') {
    return { likeCount: 0, dislikeCount: 0, commentCount: await commentCountPromise, viewerReaction: null, reactionMode }
  }

  const ipHash = await getBongstagramIpHash()
  const [commentCount, likeResult, dislikeResult, viewerResult] = await Promise.all([commentCountPromise,
    supabase.from('bbs_article_reactions').select('id', { count: 'exact', head: true }).eq('article_id', id).eq('reaction', 'like'),
    supabase.from('bbs_article_reactions').select('id', { count: 'exact', head: true }).eq('article_id', id).eq('reaction', 'dislike'),
    ipHash
      ? supabase.from('bbs_article_reactions').select('reaction').eq('article_id', id).eq('ip_hash', ipHash).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (likeResult.error || dislikeResult.error || viewerResult.error) {
    console.error('BBS article engagement load failed:', likeResult.error?.message, dislikeResult.error?.message, viewerResult.error?.message)
  }

  return {
    likeCount: likeResult.count ?? 0,
    dislikeCount: dislikeResult.count ?? 0,
    commentCount,
    viewerReaction: viewerResult.data?.reaction === 'like' || viewerResult.data?.reaction === 'dislike' ? viewerResult.data.reaction : null,
    reactionMode,
  }
}

export async function getBbsArticleComments(articleId: string): Promise<{ comments: BbsArticleComment[]; error?: string }> {
  const id = articleId.trim()
  if (!isValidArticleId(id)) return { comments: [], error: '기사를 찾을 수 없습니다.' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('bbs_article_comments')
    .select('id, author_character_id, author_name, content, created_at')
    .eq('article_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('BBS article comments load failed:', error.code, error.message)
    return { comments: [], error: '댓글을 불러오지 못했습니다.' }
  }

  const commentRows = (data ?? []) as Array<{ id: string; author_character_id: string | null; author_name: string; content: string; created_at: string }>
  const characterIds = [...new Set(commentRows.map((comment) => comment.author_character_id).filter((id): id is string => Boolean(id)))]
  const { data: characters, error: characterError } = characterIds.length
    ? await supabase.from('characters').select('id, name, avatar_url, streamer_id').in('id', characterIds)
    : { data: [], error: null }
  const characterRows = (characters ?? []) as Array<{ id: string; name: string; avatar_url: string | null; streamer_id: string | null }>
  const streamerIds = [...new Set(characterRows.map((character) => character.streamer_id).filter((id): id is string => Boolean(id)))]
  const { data: streamers, error: streamerError } = streamerIds.length
    ? await supabase.from('streamers').select('id, display_name, profile_image_url').in('id', streamerIds)
    : { data: [], error: null }
  const characterById = new Map(characterRows.map((character) => [character.id, character]))
  const streamerById = new Map((streamers ?? []).map((streamer) => [streamer.id, streamer]))

  if (characterError || streamerError) {
    console.error('BBS article comment author data load failed:', characterError?.message, streamerError?.message)
  }

  return {
    comments: commentRows.map((comment) => {
      const character = comment.author_character_id ? characterById.get(comment.author_character_id) : undefined
      const streamer = character?.streamer_id ? streamerById.get(character.streamer_id) : undefined
      return {
      id: comment.id,
      authorCharacterId: comment.author_character_id,
      authorName: comment.author_name,
      characterName: character?.name ?? null,
      characterAvatarUrl: character?.avatar_url ?? null,
      streamerName: streamer?.display_name ?? null,
      streamerAvatarUrl: streamer?.profile_image_url ?? null,
      content: comment.content,
      createdAt: comment.created_at,
      }
    }),
  }
}
