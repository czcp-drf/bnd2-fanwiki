import { createClient } from '@/lib/supabase/server'
import { getBbsCategoryKey, getBbsCategoryLabel, type BbsArticle, type BbsArticleMedia, type BbsCategoryKey } from './articles'

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

type MediaRow = {
  id: string
  article_id: string
  image_url: string
  sort_order: number
}

type ReporterRow = {
  id: string
  name: string
}

function mapArticles(articles: ArticleRow[], media: MediaRow[], reporters: ReporterRow[]): BbsArticle[] {
  const mediaByArticleId = new Map<string, BbsArticleMedia[]>()
  for (const item of media) {
    const current = mediaByArticleId.get(item.article_id) ?? []
    current.push({ id: item.id, imageUrl: item.image_url, sortOrder: item.sort_order })
    mediaByArticleId.set(item.article_id, current)
  }

  const reporterById = new Map(reporters.map((reporter) => [reporter.id, reporter.name]))

  return articles
    .filter((article) => article.approved_at && getBbsCategoryKey(article.category))
    .map((article) => {
      const categoryKey = getBbsCategoryKey(article.category) as BbsCategoryKey
      return {
        id: article.id,
        category: getBbsCategoryLabel(categoryKey),
        categoryKey,
        title: article.title,
        summary: article.summary ?? '',
        content: article.content,
        author: reporterById.get(article.reporter_character_id) ?? '알 수 없는 기자',
        approvedAt: article.approved_at as string,
        thumbnailUrl: article.thumbnail_url,
        media: mediaByArticleId.get(article.id) ?? [],
      }
    })
}

async function loadArticles(categoryKey?: BbsCategoryKey, articleId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('bbs_articles')
    .select('id, title, category, summary, content, thumbnail_url, approved_at, is_published, reporter_character_id')
    .eq('is_published', true)
    .not('approved_at', 'is', null)

  if (categoryKey) query = query.eq('category', categoryKey)
  if (articleId) query = query.eq('id', articleId)

  const { data: articleData, error: articleError } = await query
    .order('approved_at', { ascending: false })
    .order('id', { ascending: false })

  if (articleError) {
    console.error('BBS public article load failed:', articleError.message)
    return []
  }

  const articles = (articleData ?? []) as ArticleRow[]
  if (!articles.length) return []

  const articleIds = articles.map((article) => article.id)
  const reporterIds = [...new Set(articles.map((article) => article.reporter_character_id))]
  const [{ data: mediaData, error: mediaError }, { data: reporterData, error: reporterError }] = await Promise.all([
    supabase.from('bbs_article_media').select('id, article_id, image_url, sort_order').in('article_id', articleIds).order('sort_order'),
    supabase.from('characters').select('id, name').in('id', reporterIds),
  ])

  if (mediaError) console.error('BBS public article media load failed:', mediaError.message)
  if (reporterError) console.error('BBS public reporter load failed:', reporterError.message)

  return mapArticles(articles, (mediaData ?? []) as MediaRow[], (reporterData ?? []) as ReporterRow[])
}

export async function getPublishedBbsArticles(category?: string) {
  return loadArticles(getBbsCategoryKey(category) ?? undefined)
}

export async function getPublishedBbsArticle(id: string) {
  return (await loadArticles(undefined, id))[0] ?? null
}
