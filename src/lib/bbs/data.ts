import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { getBbsCategoryKey, getBbsCategoryLabel, type BbsArticle, type BbsArticleMedia, type BbsCategoryKey } from './articles'
import { BBS_DAYS, isWithinBbsDay, type BbsDayKey } from './days'
import { replaceBbsImageUrls } from './media'

export const BBS_ARTICLE_LIST_TAG = 'bbs-article-list'
export const BBS_ARTICLE_NEIGHBORS_TAG = 'bbs-article-neighbors'
export const BBS_ARTICLE_DETAILS_TAG = 'bbs-article-details'
export function getBbsArticleTag(articleId: string) { return `bbs-article:${articleId}` }
const BBS_LIST_CACHE_REVALIDATE_SECONDS = 60 * 60 * 24 * 365
const BBS_DETAILS_CACHE_REVALIDATE_SECONDS = 60 * 60 * 24 * 30
const BBS_MEDIA_MODE = process.env.BBS_MEDIA_MODE === 'external' ? 'external' : 'storage'
export type BbsSortOrder = 'latest' | 'oldest'

export { BBS_DAYS, type BbsDayKey } from './days'

export type BbsReporterOption = {
  id: string
  name: string
  streamerName: string | null
}

export type BbsLatestArticle = {
  id: string
  title: string
  approvedAt: string
  reporter: string
}

export type BbsArticlePage = {
  articles: BbsArticle[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type BbsArticleNeighbor = { id: string; title: string } | null

type ArticleRow = {
  id: string
  title: string
  category: string
  summary: string | null
  content?: string
  thumbnail_url: string | null
  approved_at: string | null
  is_published: boolean
  reporter_character_id: string
}

type MediaRow = {
  id: string
  article_id: string
  image_url: string
  sort_order: number
}

type ReporterRow = {
  id: string
  name: string
  streamer_id: string | null
}

type StreamerRow = { id: string; display_name: string }
type SourceMappingRow = { article_id: string; source_url: string; storage_url: string }

function mapArticles(articles: ArticleRow[], media: MediaRow[], reporters: ReporterRow[], streamers: StreamerRow[], sourceMappings: SourceMappingRow[] = []): BbsArticle[] {
  const mediaByArticleId = new Map<string, BbsArticleMedia[]>()
  for (const item of media) {
    const current = mediaByArticleId.get(item.article_id) ?? []
    current.push({ id: item.id, imageUrl: item.image_url, sortOrder: item.sort_order })
    mediaByArticleId.set(item.article_id, current)
  }

  const reporterById = new Map(reporters.map((reporter) => [reporter.id, reporter]))
  const streamerById = new Map(streamers.map((streamer) => [streamer.id, streamer.display_name]))
  const sourceMappingsByArticleId = new Map<string, Map<string, string>>()
  for (const mapping of sourceMappings) {
    const replacements = sourceMappingsByArticleId.get(mapping.article_id) ?? new Map<string, string>()
    replacements.set(mapping.storage_url, mapping.source_url)
    sourceMappingsByArticleId.set(mapping.article_id, replacements)
  }

  return articles
    .filter((article) => article.approved_at && getBbsCategoryKey(article.category))
    .map((article) => {
      const categoryKey = getBbsCategoryKey(article.category) as BbsCategoryKey
      const replacements = sourceMappingsByArticleId.get(article.id) ?? new Map<string, string>()
      const articleMedia = mediaByArticleId.get(article.id) ?? []
      return {
        id: article.id,
        category: getBbsCategoryLabel(categoryKey),
        categoryKey,
        title: article.title,
        summary: article.summary ?? '',
        content: replaceBbsImageUrls(article.content ?? '', replacements),
        author: reporterById.get(article.reporter_character_id)?.name ?? '알 수 없는 기자',
        authorStreamerName: (() => { const streamerId = reporterById.get(article.reporter_character_id)?.streamer_id; return streamerId ? streamerById.get(streamerId) ?? null : null })(),
        approvedAt: article.approved_at as string,
        thumbnailUrl: article.thumbnail_url ? replacements.get(article.thumbnail_url) ?? article.thumbnail_url : null,
        media: articleMedia.map((item) => ({ ...item, imageUrl: replacements.get(item.imageUrl) ?? item.imageUrl })),
      }
    })
}

async function loadArticlesUncached(categoryKey?: BbsCategoryKey, articleId?: string, reporterIds?: string[], pagination?: { page: number; pageSize: number }, dayKey?: BbsDayKey, sortOrder: BbsSortOrder = 'latest', includeContent = true) {
  const supabase = createPublicClient()
  let query = supabase
    .from('bbs_articles')
    .select(`id, title, category, summary, ${includeContent ? 'content, ' : ''}thumbnail_url, approved_at, is_published, reporter_character_id`, { count: 'exact' })
    .eq('is_published', true)
    .not('approved_at', 'is', null)

  if (categoryKey) query = query.eq('category', categoryKey)
  if (articleId) query = query.eq('id', articleId)
  if (reporterIds?.length) query = query.in('reporter_character_id', reporterIds)
  if (dayKey) {
    const day = BBS_DAYS.find((item) => item.key === dayKey)
    if (day) query = query.gte('approved_at', day.start).lte('approved_at', day.end)
  }

  if (pagination) {
    const start = (pagination.page - 1) * pagination.pageSize
    query = query.range(start, start + pagination.pageSize - 1)
  }

  const { data: articleData, count: articleCount, error: articleError } = await query
    .order('approved_at', { ascending: sortOrder === 'oldest' })
    .order('id', { ascending: false })

  if (articleError) {
    console.error('BBS public article load failed:', articleError.message)
    return { articles: [], total: 0 }
  }

  const articles = (articleData ?? []) as ArticleRow[]
  if (!articles.length) return { articles: [], total: articleCount ?? 0 }

  const articleIds = articles.map((article) => article.id)
  const articleReporterIds = [...new Set(articles.map((article) => article.reporter_character_id))]
  const [{ data: mediaData, error: mediaError }, { data: reporterData, error: reporterError }] = await Promise.all([
    supabase.from('bbs_article_media').select('id, article_id, image_url, sort_order').in('article_id', articleIds).order('sort_order'),
    supabase.from('characters').select('id, name, streamer_id').in('id', articleReporterIds),
  ])

  if (mediaError) console.error('BBS public article media load failed:', mediaError.message)
  if (reporterError) console.error('BBS public reporter load failed:', reporterError.message)

  let sourceMappings: SourceMappingRow[] = []
  if (BBS_MEDIA_MODE === 'external') {
    const { data, error } = await supabase
      .from('bbs_article_media_sources')
      .select('article_id, source_url, storage_url')
      .in('article_id', articleIds)
    if (error) console.error('BBS public image source mapping load failed:', error.message)
    sourceMappings = (data ?? []) as SourceMappingRow[]
  }

  const reporterRows = (reporterData ?? []) as ReporterRow[]
  const streamerIds = [...new Set(reporterRows.map((reporter) => reporter.streamer_id).filter((id): id is string => Boolean(id)))]
  const { data: streamerData, error: streamerError } = streamerIds.length
    ? await supabase.from('streamers').select('id, display_name').in('id', streamerIds)
    : { data: [], error: null }
  if (streamerError) console.error('BBS public streamer load failed:', streamerError.message)

  return { articles: mapArticles(articles, (mediaData ?? []) as MediaRow[], reporterRows, (streamerData ?? []) as StreamerRow[], sourceMappings), total: articleCount ?? articles.length }
}

function serializeReporterIds(reporterIds?: string[]) {
  return [...new Set((reporterIds ?? []).map((id) => id.trim()).filter(Boolean))].sort().join(',')
}

const getCachedBbsArticleList = unstable_cache(
  async (
    categoryKey: BbsCategoryKey | undefined,
    articleId: string | undefined,
    reporterIdsKey: string,
    page: number | undefined,
    pageSize: number | undefined,
    dayKey: BbsDayKey | undefined,
    sortOrder: BbsSortOrder,
    includeContent: boolean,
  ) => loadArticlesUncached(
    categoryKey,
    articleId,
    reporterIdsKey ? reporterIdsKey.split(',') : undefined,
    page !== undefined && pageSize !== undefined ? { page, pageSize } : undefined,
    dayKey,
    sortOrder,
    includeContent,
  ),
  ['bbs-public-article-list', BBS_MEDIA_MODE],
  { revalidate: BBS_LIST_CACHE_REVALIDATE_SECONDS, tags: [BBS_ARTICLE_LIST_TAG] },
)

async function loadArticles(categoryKey?: BbsCategoryKey, articleId?: string, reporterIds?: string[], pagination?: { page: number; pageSize: number }, dayKey?: BbsDayKey, sortOrder: BbsSortOrder = 'latest', includeContent = true) {
  return getCachedBbsArticleList(
    categoryKey,
    articleId,
    serializeReporterIds(reporterIds),
    pagination?.page,
    pagination?.pageSize,
    dayKey,
    sortOrder,
    includeContent,
  )
}

export async function getPublishedBbsArticles(category?: string, reporterIds?: string[]) {
  return (await loadArticles(getBbsCategoryKey(category) ?? undefined, undefined, reporterIds)).articles
}

export async function getPublishedBbsArticle(id: string) {
  const articleId = id.trim()
  if (!articleId) return null
  const getCachedArticle = unstable_cache(
    async () => loadArticlesUncached(undefined, articleId, undefined, undefined, undefined, 'latest', true),
    ['bbs-public-article', articleId, BBS_MEDIA_MODE],
    { revalidate: BBS_DETAILS_CACHE_REVALIDATE_SECONDS, tags: [BBS_ARTICLE_DETAILS_TAG, getBbsArticleTag(articleId)] },
  )
  return (await getCachedArticle()).articles[0] ?? null
}

export async function getPublishedBbsArticlesPage(category: string | undefined, reporterIds: string[] | undefined, page: number, pageSize = 12, dayKey?: BbsDayKey, sortOrder: BbsSortOrder = 'latest', includeContent = false): Promise<BbsArticlePage> {
  const safePageSize = Math.min(Math.max(pageSize, 1), 30)
  const safePage = Math.max(page, 1)
  const categoryKey = getBbsCategoryKey(category) ?? undefined
  let result = await loadArticles(categoryKey, undefined, reporterIds, { page: safePage, pageSize: safePageSize }, dayKey, sortOrder, includeContent)
  const totalPages = Math.max(1, Math.ceil(result.total / safePageSize))
  const actualPage = Math.min(safePage, totalPages)
  if (actualPage !== safePage) result = await loadArticles(categoryKey, undefined, reporterIds, { page: actualPage, pageSize: safePageSize }, dayKey, sortOrder, includeContent)
  return { articles: result.articles, page: actualPage, pageSize: safePageSize, total: result.total, totalPages }
}

const getCachedAvailableBbsDayKeys = unstable_cache(
  async () => {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('bbs_articles')
      .select('approved_at')
      .eq('is_published', true)
      .not('approved_at', 'is', null)

    if (error) {
      console.error('BBS available day load failed:', error.message)
      return []
    }

    const approvedTimes = ((data ?? []) as Array<{ approved_at: string | null }>).map((article) => article.approved_at).filter((value): value is string => Boolean(value))
    return BBS_DAYS.filter((day) => approvedTimes.some((approvedAt) => isWithinBbsDay(approvedAt, day))).map((day) => day.key)
  },
  ['bbs-available-days-v2'],
  { revalidate: BBS_LIST_CACHE_REVALIDATE_SECONDS, tags: [BBS_ARTICLE_LIST_TAG] },
)

export async function getAvailableBbsDayKeys() {
  return getCachedAvailableBbsDayKeys()
}

const getCachedBbsArticleNeighbors = unstable_cache(
  async (articleId: string, category: string | undefined, reporterIdsKey: string, dayKey: BbsDayKey | undefined, sortOrder: BbsSortOrder) => {
    const supabase = createPublicClient()
    let query = supabase
      .from('bbs_articles')
      .select('id, title, approved_at')
      .eq('is_published', true)
      .not('approved_at', 'is', null)
    const categoryKey = getBbsCategoryKey(category) ?? undefined
    if (categoryKey) query = query.eq('category', categoryKey)
    if (reporterIdsKey) query = query.in('reporter_character_id', reporterIdsKey.split(','))
    if (dayKey) {
      const day = BBS_DAYS.find((item) => item.key === dayKey)
      if (day) query = query.gte('approved_at', day.start).lte('approved_at', day.end)
    }
    const ascending = sortOrder === 'oldest'
    const { data, error } = await query.order('approved_at', { ascending }).order('id', { ascending })
    if (error) {
      console.error('BBS article neighbor load failed:', error.message)
      return { previous: null, next: null }
    }
    const rows = (data ?? []) as { id: string; title: string }[]
    const currentIndex = rows.findIndex((row) => row.id === articleId)
    return {
      previous: currentIndex > 0 ? rows[currentIndex - 1] : null,
      next: currentIndex >= 0 && currentIndex < rows.length - 1 ? rows[currentIndex + 1] : null,
    }
  },
  ['bbs-article-neighbors'],
  { revalidate: BBS_DETAILS_CACHE_REVALIDATE_SECONDS, tags: [BBS_ARTICLE_NEIGHBORS_TAG] },
)

export async function getPublishedBbsArticleNeighbors(articleId: string, category?: string, reporterIds?: string[], dayKey?: BbsDayKey, sortOrder: BbsSortOrder = 'latest') {
  return getCachedBbsArticleNeighbors(articleId, getBbsCategoryKey(category) ?? undefined, serializeReporterIds(reporterIds), dayKey, sortOrder)
}

const getCachedBbsReporterOptions = unstable_cache(
  async (): Promise<BbsReporterOption[]> => {
    const supabase = createPublicClient()
    const { data: organizationData } = await supabase
      .from('organizations')
      .select('id')
      .eq('type', 'journalist')
      .eq('is_active', true)

    const organizationIds = ((organizationData ?? []) as { id: string }[]).map((organization) => organization.id)
    if (!organizationIds.length) return []

    const { data: membershipData } = await supabase
      .from('organization_members')
      .select('character_id')
      .in('organization_id', organizationIds)
      .is('left_at', null)

    const reporterIds = [...new Set(((membershipData ?? []) as { character_id: string }[]).map((member) => member.character_id))]
    if (!reporterIds.length) return []

    const { data: reporterData } = await supabase
      .from('characters')
      .select('id, name, streamer_id')
      .in('id', reporterIds)
      .order('name')

    const reporterRows = (reporterData ?? []) as ReporterRow[]
    const streamerIds = [...new Set(reporterRows.map((reporter) => reporter.streamer_id).filter((id): id is string => Boolean(id)))]
    const streamerResult = streamerIds.length
      ? await supabase.from('streamers').select('id, display_name').in('id', streamerIds)
      : null
    const streamerData = (streamerResult?.data ?? []) as StreamerRow[]
    const streamerError = streamerResult?.error ?? null
    if (streamerError) console.error('BBS public reporter streamer load failed:', streamerError.message)
    const streamerById = new Map((streamerData ?? []).map((streamer) => [streamer.id, streamer.display_name]))

    return reporterRows.map((reporter) => ({
      id: reporter.id,
      name: reporter.name,
      streamerName: reporter.streamer_id ? streamerById.get(reporter.streamer_id) ?? null : null,
    }))
  },
  ['bbs-reporter-options-v2'],
  { revalidate: BBS_LIST_CACHE_REVALIDATE_SECONDS, tags: [BBS_ARTICLE_LIST_TAG] },
)

export function getBbsReporterOptions() {
  return getCachedBbsReporterOptions()
}

const getCachedLatestBbsArticle = unstable_cache(
  async (): Promise<BbsLatestArticle | null> => {
    const supabase = createPublicClient()
    const { data: articleData } = await supabase
      .from('bbs_articles')
      .select('id, title, approved_at, reporter_character_id')
      .eq('is_published', true)
      .not('approved_at', 'is', null)
      .order('approved_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    const article = articleData as { id: string; title: string; approved_at: string | null; reporter_character_id: string } | null
    if (!article?.approved_at) return null

    const { data: reporterData } = await supabase
      .from('characters')
      .select('name')
      .eq('id', article.reporter_character_id)
      .maybeSingle()
    const reporter = reporterData as { name: string } | null

    return {
      id: article.id,
      title: article.title,
      approvedAt: article.approved_at,
      reporter: reporter?.name ?? '알 수 없는 기자',
    }
  },
  ['bbs-latest-article'],
  { revalidate: BBS_LIST_CACHE_REVALIDATE_SECONDS, tags: [BBS_ARTICLE_LIST_TAG] },
)

export function getLatestBbsArticle() {
  return getCachedLatestBbsArticle()
}
