import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import BbsArticleVisual from '../../components/BbsArticleVisual'
import BbsArticleContent from '../../components/BbsArticleContent'
import BbsLogo from '../../components/BbsLogo'
import BbsArticleInteractions from '../../components/BbsArticleInteractions'
import BbsShareButton from '../../components/BbsShareButton'
import BbsZoomableImage from '../../components/BbsZoomableImage'
import BongstagramDisplayName from '@/app/bongstagram/BongstagramDisplayName'
import { getPublishedBbsArticle, getPublishedBbsArticleNeighbors, type BbsSortOrder } from '@/lib/bbs/data'
import { BBS_DAYS, type BbsDayKey } from '@/lib/bbs/days'
import { getBbsArticleEngagement } from '@/lib/bbs/engagement'

export const revalidate = 60 * 60 * 24 * 30

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ category?: string; reporter?: string | string[]; day?: string; order?: string }>
}

function formatArticleDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: false }).format(new Date(value))
}

function removeRepresentativeImage(content: string, imageUrl: string) {
  const escapedUrl = imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return content.replace(new RegExp(`!\\[[^\\]]*\\]\\(${escapedUrl}\\)\\s*`, 'i'), '').trim()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const article = await getPublishedBbsArticle(id)
  return article ? { title: article.title, description: article.summary } : { title: '기사를 찾을 수 없습니다' }
}

export default async function BbsArticlePage({ params, searchParams }: Props) {
  const { id } = await params
  const query = await searchParams
  const activeDay = BBS_DAYS.some((item) => item.key === query.day) ? query.day as BbsDayKey : undefined
  const activeSort: BbsSortOrder = query.order === 'oldest' ? 'oldest' : 'latest'
  const reporterIds = query.reporter ? (Array.isArray(query.reporter) ? query.reporter.join(',') : query.reporter).split(',').map((value) => value.trim()).filter(Boolean) : []
  const listParams = new URLSearchParams()
  if (query.category) listParams.set('category', query.category)
  if (query.reporter) listParams.set('reporter', Array.isArray(query.reporter) ? query.reporter.join(',') : query.reporter)
  if (query.day) listParams.set('day', query.day)
  if (query.order === 'oldest') listParams.set('order', 'oldest')
  const listQuery = listParams.toString()
  const article = await getPublishedBbsArticle(id)
  if (!article) notFound()
  const [engagement, neighbors] = await Promise.all([
    getBbsArticleEngagement(article.id),
    getPublishedBbsArticleNeighbors(article.id, query.category, reporterIds, activeDay, activeSort),
  ])

  const heroMediaIndex = article.thumbnailUrl ? article.media.findIndex((media) => media.imageUrl === article.thumbnailUrl) : 0
  const additionalMedia = article.media.filter((_, index) => index !== heroMediaIndex)
  const heroImageUrl = article.thumbnailUrl ?? article.media[0]?.imageUrl
  const bodyContent = heroImageUrl ? removeRepresentativeImage(article.content, heroImageUrl) : article.content

  return (
    <div className="bbs-theme min-h-[calc(100vh-3.5rem)] bg-[var(--bbs-page)] px-0 py-0 text-[var(--bbs-text)] md:px-4 md:py-8">
        <article className="mx-auto max-w-3xl overflow-hidden bg-[var(--bbs-surface)] md:rounded-3xl md:border md:border-[var(--bbs-border)] md:shadow-xl">
        <header className="flex items-center gap-3 border-b border-[var(--bbs-border)] px-4 py-4 sm:px-6">
          <Link href={`/bbs${listQuery ? `?${listQuery}` : ''}`} aria-label="BBS 기사 목록으로 돌아가기" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-[#d7432d]">
            <ArrowLeft size={21} />
          </Link>
          <BbsLogo compact />
          <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-[var(--bbs-text)]">{article.title}</p>
            <p className="mt-0.5 text-[10px] text-[var(--bbs-subtle-text)]"><BongstagramDisplayName profileName={article.author} streamerName={article.authorStreamerName} /></p>
          </div>
          <BbsShareButton className="text-[#d7432d] hover:bg-[#d7432d]/10 hover:text-[#a82f23]" />
        </header>

        <main className="bg-[var(--bbs-surface)] px-5 pb-8 pt-7 sm:px-10 sm:pb-12 sm:pt-10">
          <h1 className="text-2xl font-black leading-tight tracking-tight text-[var(--bbs-text)] sm:text-3xl">{article.title}</h1>
          <div className="mt-4 space-y-1 text-xs text-[var(--bbs-subtle-text)]">
            <p><BongstagramDisplayName profileName={article.author} streamerName={article.authorStreamerName} /></p>
            <time dateTime={article.approvedAt}>승인 {formatArticleDate(article.approvedAt)}</time>
          </div>
          <div className="my-6 h-px bg-[var(--bbs-border)]" />
          <BbsArticleVisual article={article} detail />
          {additionalMedia.length > 0 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {additionalMedia.map((media) => (
                <BbsZoomableImage key={media.id} src={media.imageUrl} alt="기사 첨부 이미지 확대" previewClassName="aspect-[4/3] rounded-xl" sizes="(max-width: 640px) 100vw, 384px" />
              ))}
            </div>
          )}
          <BbsArticleContent content={bodyContent} className="mt-7" />
          <nav aria-label="기사 이동" className="mt-10 grid grid-cols-2 gap-3 border-t border-[var(--bbs-border)] pt-5">
            {neighbors.previous ? <Link href={`/bbs/article/${neighbors.previous.id}${listQuery ? `?${listQuery}` : ''}`} className="group min-w-0 rounded-xl border border-[var(--bbs-border)] px-4 py-3 transition-colors hover:border-[#d7432d]/40 hover:bg-[#d7432d]/5"><span className="block text-[11px] text-[var(--bbs-subtle-text)]">이전 기사</span><span className="mt-1 block truncate text-sm font-semibold text-[var(--bbs-text)] group-hover:text-[#d7432d]">{neighbors.previous.title}</span></Link> : <span className="rounded-xl border border-[var(--bbs-border)] px-4 py-3 opacity-40"><span className="block text-[11px] text-[var(--bbs-subtle-text)]">이전 기사</span><span className="mt-1 block text-sm text-[var(--bbs-subtle-text)]">없음</span></span>}
            {neighbors.next ? <Link href={`/bbs/article/${neighbors.next.id}${listQuery ? `?${listQuery}` : ''}`} className="group min-w-0 rounded-xl border border-[var(--bbs-border)] px-4 py-3 text-right transition-colors hover:border-[#d7432d]/40 hover:bg-[#d7432d]/5"><span className="block text-[11px] text-[var(--bbs-subtle-text)]">다음 기사</span><span className="mt-1 block truncate text-sm font-semibold text-[var(--bbs-text)] group-hover:text-[#d7432d]">{neighbors.next.title}</span></Link> : <span className="rounded-xl border border-[var(--bbs-border)] px-4 py-3 text-right opacity-40"><span className="block text-[11px] text-[var(--bbs-subtle-text)]">다음 기사</span><span className="mt-1 block text-sm text-[var(--bbs-subtle-text)]">없음</span></span>}
          </nav>
          <BbsArticleInteractions articleId={article.id} initial={engagement} />
        </main>
        </article>
    </div>
  )
}
