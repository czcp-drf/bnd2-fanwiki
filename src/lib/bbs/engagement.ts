import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBongstagramIpHash } from '@/lib/bongstagram/like-ip'
import { getBbsReactionMode, type BbsReactionMode } from './reaction-mode'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type BbsArticleReaction = 'like' | 'dislike'

export type BbsArticleEngagement = {
  likeCount: number
  dislikeCount: number
  viewerReaction: BbsArticleReaction | null
  reactionMode: BbsReactionMode
}

function isValidArticleId(articleId: string) {
  return UUID_PATTERN.test(articleId.trim())
}

export async function getBbsArticleEngagement(articleId: string): Promise<BbsArticleEngagement> {
  const id = articleId.trim()
  const reactionMode = getBbsReactionMode()
  if (!isValidArticleId(id)) return { likeCount: 0, dislikeCount: 0, viewerReaction: null, reactionMode }

  const supabase = createAdminClient()
  if (reactionMode === 'local') {
    return { likeCount: 0, dislikeCount: 0, viewerReaction: null, reactionMode }
  }

  const ipHash = await getBongstagramIpHash()
  const [likeResult, dislikeResult, viewerResult] = await Promise.all([
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
    viewerReaction: viewerResult.data?.reaction === 'like' || viewerResult.data?.reaction === 'dislike' ? viewerResult.data.reaction : null,
    reactionMode,
  }
}
