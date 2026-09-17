import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import BbsArticleVisual from '../../components/BbsArticleVisual'
import BbsArticleContent from '../../components/BbsArticleContent'
import BbsLogo from '../../components/BbsLogo'
import BbsArticleInteractions from '../../components/BbsArticleInteractions'
import BbsArticleBackLink from '../../components/BbsArticleBackLink'
import BbsArticleNeighbors from '../../components/BbsArticleNeighbors'
import BbsShareButton from '../../components/BbsShareButton'
import BbsZoomableImage from '../../components/BbsZoomableImage'
import BongstagramDisplayName from '@/app/bongstagram/BongstagramDisplayName'
import { getPublishedBbsArticle } from '@/lib/bbs/data'

export const revalidate = 2592000

type Props = {
  params: Promise<{ id: string }>
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

export default async function BbsArticlePage({ params }: Props) {
  const { id } = await params
  const article = await getPublishedBbsArticle(id)
  if (!article) notFound()

  const heroMediaIndex = article.thumbnailUrl ? article.media.findIndex((media) => media.imageUrl === article.thumbnailUrl) : 0
  const additionalMedia = article.media.filter((_, index) => index !== heroMediaIndex)
  const heroImageUrl = article.thumbnailUrl ?? article.media[0]?.imageUrl
  const bodyContent = heroImageUrl ? removeRepresentativeImage(article.content, heroImageUrl) : article.content

  return (
    <div className="bbs-theme min-h-[calc(100vh-3.5rem)] bg-[var(--bbs-page)] px-0 py-0 text-[var(--bbs-text)] md:px-4 md:py-8">
        <article className="mx-auto max-w-3xl overflow-hidden bg-[var(--bbs-surface)] md:rounded-3xl md:border md:border-[var(--bbs-border)] md:shadow-xl">
        <header className="flex items-center gap-3 border-b border-[var(--bbs-border)] px-4 py-4 sm:px-6">
          <Suspense fallback={<span className="h-9 w-9" />}><BbsArticleBackLink /></Suspense>
          <BbsLogo compact />
          <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-[var(--bbs-text)]">{article.title}</p>
            <p className="mt-0.5 text-[10px] text-[var(--bbs-subtle-text)]"><BongstagramDisplayName profileName={article.author} streamerName={article.authorStreamerName} /></p>
          </div>
          <BbsShareButton className="text-[var(--bbs-accent-text)] hover:bg-[#d7432d]/10 hover:text-[#a82f23]" />
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
          <BbsArticleInteractions articleId={article.id} />
        </main>
        </article>
        <Suspense fallback={<div className="mx-auto mt-4 h-20 max-w-3xl" />}><BbsArticleNeighbors articleId={article.id} /></Suspense>
    </div>
  )
}
