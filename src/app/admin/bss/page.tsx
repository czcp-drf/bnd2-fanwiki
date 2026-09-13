import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import BssArticleManager from './BssArticleManager'

export const metadata: Metadata = { title: 'BSS 기사 관리' }
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

async function getBssAdminData() {
  const supabase = createAdminClient()
  const [{ data: articles, error: articleError }, { data: media, error: mediaError }, { data: reporters, error: reporterError }] = await Promise.all([
    supabase.from('bss_articles').select('id, title, category, summary, content, thumbnail_url, approved_at, is_published, reporter_character_id').order('approved_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }),
    supabase.from('bss_article_media').select('id, article_id, image_url, sort_order').order('sort_order'),
    supabase.from('characters').select('id, name, avatar_url').order('name'),
  ])
  if (articleError || mediaError || reporterError) {
    console.error('BSS admin data load failed:', articleError?.message, mediaError?.message, reporterError?.message)
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

export default async function AdminBssPage() {
  const { articles, reporters } = await getBssAdminData()
  return <div className="space-y-6 p-8"><div><h1 className="text-xl font-black text-white">BSS 기사 관리</h1><p className="mt-1 text-sm text-zinc-500">인게임 기사 등록, 공개 상태와 첨부 이미지를 관리합니다.</p></div><BssArticleManager articles={articles} reporters={reporters} /></div>
}
