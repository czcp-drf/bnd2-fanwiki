import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import BbsArticleManager from './BbsArticleManager'

export const metadata: Metadata = { title: 'BBS 기사 관리' }
export const dynamic = 'force-dynamic'

type ArticleRow = {
  id: string
  title: string
  category: string
  summary: string | null
  content: string
  thumbnail_url: string | null
  approved_at: string | null
  is_published: boolean
  reporter_character_id: string
}
type MediaRow = { id: string; article_id: string; image_url: string; sort_order: number }
type ReactionRow = { article_id: string; reaction: 'like' | 'dislike' }
type ReporterOrganizationRow = { id: string }
type ReporterMembershipRow = { character_id: string; organization_id: string }
type ReporterRow = { id: string; name: string; avatar_url: string | null; streamers: { display_name: string; profile_image_url: string | null } | null }
type CharacterQueryRow = { id: string; name: string; avatar_url: string | null; streamers: { display_name: string; profile_image_url: string | null }[] | null }
type CommentRow = { id: string; article_id: string; author_character_id: string | null; author_name: string; content: string; created_at: string }

async function getBbsAdminData() {
  const supabase = createAdminClient()
  const [{ data: articles, error: articleError }, { data: media, error: mediaError }, { data: characters, error: characterError }, { data: journalistOrganizations, error: organizationError }, { data: comments, error: commentError }, { data: reactions, error: reactionError }] = await Promise.all([
    supabase.from('bbs_articles').select('id, title, category, summary, content, thumbnail_url, approved_at, is_published, reporter_character_id').order('approved_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }),
    supabase.from('bbs_article_media').select('id, article_id, image_url, sort_order').order('sort_order'),
    supabase.from('characters').select('id, name, avatar_url, streamers ( display_name, profile_image_url )').order('name'),
    supabase.from('organizations').select('id').eq('type', 'journalist').eq('is_active', true),
    supabase.from('bbs_article_comments').select('id, article_id, author_character_id, author_name, content, created_at').order('created_at', { ascending: true }),
    supabase.from('bbs_article_reactions').select('article_id, reaction'),
  ])
  const journalistOrganizationIds = ((journalistOrganizations ?? []) as ReporterOrganizationRow[]).map((organization) => organization.id)
  const { data: journalistMembers, error: membershipError } = journalistOrganizationIds.length
    ? await supabase.from('organization_members').select('character_id, organization_id').in('organization_id', journalistOrganizationIds).is('left_at', null)
    : { data: [], error: null }
  const reporterIds = new Set(((journalistMembers ?? []) as ReporterMembershipRow[]).map((member) => member.character_id))
  const allCharacters: ReporterRow[] = ((characters ?? []) as unknown as CharacterQueryRow[]).map((character) => ({
    id: character.id,
    name: character.name,
    avatar_url: character.avatar_url,
    streamers: character.streamers?.[0] ?? null,
  }))
  const reporters = allCharacters.filter((character) => reporterIds.has(character.id))

  if (articleError || mediaError || characterError || organizationError || membershipError || commentError || reactionError) {
    console.error('BBS admin data load failed:', articleError?.message, mediaError?.message, characterError?.message, organizationError?.message, membershipError?.message, commentError?.message, reactionError?.message)
  }

  const mediaByArticleId = new Map<string, MediaRow[]>()
  for (const item of (media ?? []) as MediaRow[]) {
    const current = mediaByArticleId.get(item.article_id) ?? []
    current.push(item)
    mediaByArticleId.set(item.article_id, current)
  }

  const reactionCountsByArticleId = new Map<string, { like: number; dislike: number }>()
  for (const reaction of (reactions ?? []) as ReactionRow[]) {
    const counts = reactionCountsByArticleId.get(reaction.article_id) ?? { like: 0, dislike: 0 }
    counts[reaction.reaction] += 1
    reactionCountsByArticleId.set(reaction.article_id, counts)
  }

  return {
    articles: ((articles ?? []) as ArticleRow[]).map((article) => ({
      ...article,
      media: mediaByArticleId.get(article.id) ?? [],
      like_count: reactionCountsByArticleId.get(article.id)?.like ?? 0,
      dislike_count: reactionCountsByArticleId.get(article.id)?.dislike ?? 0,
    })),
    reporters: reporters ?? [],
    characters: allCharacters,
    comments: ((comments ?? []) as CommentRow[]),
  }
}

export default async function AdminBbsPage() {
  const { articles, reporters, characters, comments } = await getBbsAdminData()
  return <div className="space-y-6 p-8"><div><h1 className="text-xl font-black text-white">BBS 기사 관리</h1><p className="mt-1 text-sm text-zinc-500">인게임 기사 등록, 공개 상태와 첨부 이미지를 관리합니다.</p></div><BbsArticleManager articles={articles} reporters={reporters} characters={characters} comments={comments} /></div>
}
