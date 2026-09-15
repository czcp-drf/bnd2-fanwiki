import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import BbsArticleManager from './BbsArticleManager'
import BbsCacheRefreshButton from './BbsCacheRefreshButton'

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

async function getBbsReactions(supabase: ReturnType<typeof createAdminClient>, articleIds: string[]) {
  if (!articleIds.length) return { data: [], error: null }
  const pageSize = 1000
  const firstPage = await supabase
    .from('bbs_article_reactions')
    .select('article_id, reaction', { count: 'exact' })
    .in('article_id', articleIds)
    .range(0, pageSize - 1)
  if (firstPage.error) return firstPage

  const total = firstPage.count ?? firstPage.data.length
  const pageCount = Math.ceil(total / pageSize)
  if (pageCount <= 1) return firstPage

  const pages = await Promise.all(Array.from({ length: pageCount - 1 }, (_, index) => {
    const from = (index + 1) * pageSize
    return supabase
      .from('bbs_article_reactions')
      .select('article_id, reaction')
      .in('article_id', articleIds)
      .range(from, from + pageSize - 1)
  }))
  const error = pages.find((page) => page.error)?.error
  if (error) return { data: null, error, count: total, status: 0, statusText: '' }
  return { data: [...firstPage.data, ...pages.flatMap((page) => page.data)], error: null, count: total, status: firstPage.status, statusText: firstPage.statusText }
}

async function getBbsAdminData({ page, pageSize, search, category, status, reporterId, sort }: { page: number; pageSize: number; search: string; category: string; status: string; reporterId: string; sort: string }) {
  const supabase = createAdminClient()
  const safePageSize = [10, 20, 30, 40, 50].includes(pageSize) ? pageSize : 50
  const safePage = Math.max(1, page)
  let articleQuery = supabase.from('bbs_articles').select('id, title, category, summary, content, thumbnail_url, approved_at, is_published, reporter_character_id', { count: 'exact' })
  if (category !== 'all') articleQuery = articleQuery.eq('category', category)
  if (status === 'published') articleQuery = articleQuery.eq('is_published', true)
  if (status === 'draft') articleQuery = articleQuery.eq('is_published', false)
  if (reporterId !== 'all') articleQuery = articleQuery.eq('reporter_character_id', reporterId)
  const normalizedSearch = search.trim().replace(/[%,]/g, ' ')
  if (normalizedSearch) articleQuery = articleQuery.or(`title.ilike.%${normalizedSearch}%,content.ilike.%${normalizedSearch}%`)
  if (sort === 'title') articleQuery = articleQuery.order('title', { ascending: true })
  else articleQuery = articleQuery.order('approved_at', { ascending: sort === 'oldest', nullsFirst: false }).order('created_at', { ascending: sort === 'oldest' })
  const { data: articles, error: articleError, count: articleCount } = await articleQuery.range((safePage - 1) * safePageSize, safePage * safePageSize - 1)
  const articleIds = ((articles ?? []) as ArticleRow[]).map((article) => article.id)
  const [{ data: media, error: mediaError }, { data: characters, error: characterError }, { data: journalistOrganizations, error: organizationError }, { data: comments, error: commentError }, { data: reactions, error: reactionError }] = await Promise.all([
    articleIds.length ? supabase.from('bbs_article_media').select('id, article_id, image_url, sort_order').in('article_id', articleIds).order('sort_order') : Promise.resolve({ data: [], error: null }),
    supabase.from('characters').select('id, name, avatar_url, streamers ( display_name, profile_image_url )').order('name'),
    supabase.from('organizations').select('id').eq('type', 'journalist').eq('is_active', true),
    articleIds.length ? supabase.from('bbs_article_comments').select('id, article_id, author_character_id, author_name, content, created_at').in('article_id', articleIds).order('created_at', { ascending: true }) : Promise.resolve({ data: [], error: null }),
    getBbsReactions(supabase, articleIds),
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
    total: articleCount ?? 0,
    totalPages: Math.max(1, Math.ceil((articleCount ?? 0) / safePageSize)),
    currentPage: Math.min(safePage, Math.max(1, Math.ceil((articleCount ?? 0) / safePageSize))),
  }
}

export default async function AdminBbsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const get = (key: string) => Array.isArray(params[key]) ? params[key]?.[0] ?? '' : params[key] ?? ''
  const page = Number.parseInt(get('page'), 10) || 1
  const filters = { search: get('search'), category: get('category') || 'all', status: get('status') || 'all', reporterId: get('reporter') || 'all', reactionFilter: get('reaction') || 'all', sort: get('sort') || 'latest', pageSize: [10, 20, 30, 40, 50].includes(Number(get('pageSize'))) ? Number(get('pageSize')) : 50 }
  const data = await getBbsAdminData({ page, ...filters })
  return <div className="space-y-6 p-8"><div className="flex items-start justify-between gap-4"><div><h1 className="text-xl font-black text-white">BBS 기사 관리</h1><p className="mt-1 text-sm text-zinc-500">인게임 기사 등록, 공개 상태와 첨부 이미지를 관리합니다.</p></div><BbsCacheRefreshButton /></div><BbsArticleManager key={`${filters.search}:${filters.category}:${filters.status}:${filters.reporterId}:${filters.reactionFilter}:${filters.sort}:${filters.pageSize}:${data.currentPage}`} articles={data.articles} reporters={data.reporters} characters={data.characters} comments={data.comments} total={data.total} totalPages={data.totalPages} currentPage={data.currentPage} filters={filters} /></div>
}
