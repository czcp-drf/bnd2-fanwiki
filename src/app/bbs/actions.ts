'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBongstagramIpHash } from '@/lib/bongstagram/like-ip'
import { getBbsArticleComments, getBbsArticleEngagement, type BbsArticleReaction } from '@/lib/bbs/engagement'
import { getBbsReactionMode } from '@/lib/bbs/reaction-mode'
import { getPublishedBbsArticlesPage, type BbsSortOrder } from '@/lib/bbs/data'
import type { BbsDayKey } from '@/lib/bbs/days'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const BBS_REACTION_RATE_LIMIT_SECONDS = 30

export async function getBbsArticlesPageAction(category: string | undefined, reporterIds: string[], page: number, day?: BbsDayKey, sortOrder: BbsSortOrder = 'latest') {
  return getPublishedBbsArticlesPage(category, reporterIds.length ? reporterIds : undefined, page, 12, day, sortOrder, false)
}

export async function getBbsArticleEngagementAction(articleId: string) {
  return getBbsArticleEngagement(articleId)
}

export async function getBbsArticleCommentsAction(articleId: string) {
  return getBbsArticleComments(articleId)
}

export async function toggleBbsArticleReaction(articleId: string, reaction: BbsArticleReaction) {
  if (getBbsReactionMode() === 'local') return { error: '현재 기사 반응은 이 브라우저에서만 처리됩니다.' }

  const id = articleId.trim()
  if (!UUID_PATTERN.test(id)) return { error: '기사를 찾을 수 없습니다.' }
  if (reaction !== 'like') return { error: '현재 좋아요만 사용할 수 있습니다.' }

  const ipHash = await getBongstagramIpHash()
  if (!ipHash) return { error: '접속 환경을 확인할 수 없어 반응을 처리할 수 없습니다.' }

  const supabase = createAdminClient()
  const { data: article, error: articleError } = await supabase
    .from('bbs_articles')
    .select('id')
    .eq('id', id)
    .eq('is_published', true)
    .not('approved_at', 'is', null)
    .maybeSingle()

  if (articleError || !article) return { error: '공개된 기사를 찾을 수 없습니다.' }

  const { data: rateLimitAccepted, error: rateLimitError } = await supabase.rpc('check_bbs_article_reaction_rate_limit', {
    p_article_id: id,
    p_ip_hash: ipHash,
    p_window_seconds: BBS_REACTION_RATE_LIMIT_SECONDS,
  })

  if (rateLimitError) {
    console.error('BBS article reaction rate limit failed:', rateLimitError.message)
    return { error: '기사 반응을 처리하지 못했습니다.' }
  }
  if (!rateLimitAccepted) {
    return {
      error: `${BBS_REACTION_RATE_LIMIT_SECONDS}초 후 다시 시도해 주세요.`,
      rateLimited: true,
      retryAfterSeconds: BBS_REACTION_RATE_LIMIT_SECONDS,
    }
  }

  const { data: existing, error: existingError } = await supabase
    .from('bbs_article_reactions')
    .select('id, reaction')
    .eq('article_id', id)
    .eq('ip_hash', ipHash)
    .maybeSingle()

  if (existingError) {
    console.error('BBS article reaction lookup failed:', existingError.code, existingError.message)
    return { error: '기사 반응을 확인하지 못했습니다.' }
  }

  let viewerReaction: BbsArticleReaction | null = reaction
  if (existing?.reaction === reaction) {
    const { error } = await supabase.from('bbs_article_reactions').delete().eq('id', existing.id)
    if (error) return { error: '기사 반응을 취소하지 못했습니다.' }
    viewerReaction = null
  } else if (existing) {
    const { error } = await supabase.from('bbs_article_reactions').update({ reaction }).eq('id', existing.id)
    if (error) return { error: '기사 반응을 변경하지 못했습니다.' }
  } else {
    const { error } = await supabase.from('bbs_article_reactions').insert({ article_id: id, ip_hash: ipHash, reaction })
    if (error) {
      console.error('BBS article reaction insert failed:', error.code, error.message)
      return { error: '기사 반응을 등록하지 못했습니다.' }
    }
  }

  revalidatePath('/bbs')
  revalidatePath(`/bbs/article/${id}`)
  return { success: true, viewerReaction }
}
