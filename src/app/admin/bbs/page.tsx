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
type ReporterOrganizationRow = { id: string }
type ReporterMembershipRow = { character_id: string; organization_id: string }
type ReporterRow = { id: string; name: string; avatar_url: string | null }

async function getBbsAdminData() {
  const supabase = createAdminClient()
  const [{ data: articles, error: articleError }, { data: media, error: mediaError }, { data: characters, error: characterError }, { data: journalistOrganizations, error: organizationError }] = await Promise.all([
    supabase.from('bbs_articles').select('id, title, category, summary, content, thumbnail_url, approved_at, is_published, reporter_character_id').order('approved_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }),
    supabase.from('bbs_article_media').select('id, article_id, image_url, sort_order').order('sort_order'),
    supabase.from('characters').select('id, name, avatar_url').order('name'),
    supabase.from('organizations').select('id').eq('type', 'journalist').eq('is_active', true),
  ])
  const journalistOrganizationIds = ((journalistOrganizations ?? []) as ReporterOrganizationRow[]).map((organization) => organization.id)
  const { data: journalistMembers, error: membershipError } = journalistOrganizationIds.length
    ? await supabase.from('organization_members').select('character_id, organization_id').in('organization_id', journalistOrganizationIds).is('left_at', null)
    : { data: [], error: null }
  const reporterIds = new Set(((journalistMembers ?? []) as ReporterMembershipRow[]).map((member) => member.character_id))
  const reporters = ((characters ?? []) as ReporterRow[]).filter((character) => reporterIds.has(character.id))

  if (articleError || mediaError || characterError || organizationError || membershipError) {
    console.error('BBS admin data load failed:', articleError?.message, mediaError?.message, characterError?.message, organizationError?.message, membershipError?.message)
  }

  const mediaByArticleId = new Map<string, MediaRow[]>()
  for (const item of (media ?? []) as MediaRow[]) {
    const current = mediaByArticleId.get(item.article_id) ?? []
    current.push(item)
    mediaByArticleId.set(item.article_id, current)
  }

  return {
    articles: ((articles ?? []) as ArticleRow[]).map((article) => ({ ...article, media: mediaByArticleId.get(article.id) ?? [] })),
    reporters: reporters ?? [],
  }
}

export default async function AdminBbsPage() {
  const { articles, reporters } = await getBbsAdminData()
  return <div className="space-y-6 p-8"><div><h1 className="text-xl font-black text-white">BBS 기사 관리</h1><p className="mt-1 text-sm text-zinc-500">인게임 기사 등록, 공개 상태와 첨부 이미지를 관리합니다.</p></div><BbsArticleManager articles={articles} reporters={reporters} /></div>
}
