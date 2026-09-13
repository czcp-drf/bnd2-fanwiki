import { createAdminClient } from '@/lib/supabase/admin'
import { getBongstagramIpHash } from '@/lib/bongstagram/like-ip'
import { getBbsReactionMode, type BbsReactionMode } from './reaction-mode'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type BbsArticleReaction = 'like' | 'dislike'

export type BbsArticleComment = {
  id: string
  authorCharacterId: string | null
  authorName: string
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

export async function getBbsArticleEngagement(articleId: string): Promise<BbsArticleEngagement> {
  const id = articleId.trim()
  const reactionMode = getBbsReactionMode()
  if (!isValidArticleId(id)) return { likeCount: 0, dislikeCount: 0, commentCount: 0, viewerReaction: null, reactionMode }

  const supabase = createAdminClient()
  const commentResult = await supabase.from('bbs_article_comments').select('id', { count: 'exact', head: true }).eq('article_id', id)
  if (reactionMode === 'local') {
    if (commentResult.error) console.error('BBS article comment count load failed:', commentResult.error.message)
    return { likeCount: 0, dislikeCount: 0, commentCount: commentResult.count ?? 0, viewerReaction: null, reactionMode }
  }

  const ipHash = await getBongstagramIpHash()
  const [likeResult, dislikeResult, viewerResult] = await Promise.all([
    supabase.from('bbs_article_reactions').select('id', { count: 'exact', head: true }).eq('article_id', id).eq('reaction', 'like'),
    supabase.from('bbs_article_reactions').select('id', { count: 'exact', head: true }).eq('article_id', id).eq('reaction', 'dislike'),
    ipHash
      ? supabase.from('bbs_article_reactions').select('reaction').eq('article_id', id).eq('ip_hash', ipHash).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (likeResult.error || dislikeResult.error || commentResult.error || viewerResult.error) {
    console.error('BBS article engagement load failed:', likeResult.error?.message, dislikeResult.error?.message, commentResult.error?.message, viewerResult.error?.message)
  }

  return {
    likeCount: likeResult.count ?? 0,
    dislikeCount: dislikeResult.count ?? 0,
    commentCount: commentResult.count ?? 0,
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

  return {
    comments: (data ?? []).map((comment) => ({
      id: comment.id,
      authorCharacterId: comment.author_character_id,
      authorName: comment.author_name,
      content: comment.content,
      createdAt: comment.created_at,
    })),
  }
}
