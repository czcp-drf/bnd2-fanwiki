import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import AppImage from '@/components/ui/AppImage'
import BbsArticleVisual from '../../components/BbsArticleVisual'
import BbsArticleContent from '../../components/BbsArticleContent'
import BbsLogo from '../../components/BbsLogo'
import BbsArticleInteractions from '../../components/BbsArticleInteractions'
import BbsShareButton from '../../components/BbsShareButton'
import { getPublishedBbsArticle } from '@/lib/bbs/data'
import { getBbsArticleEngagement } from '@/lib/bbs/engagement'

type Props = {
  params: Promise<{ id: string }>
}

function formatArticleDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: false }).format(new Date(value))
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
  const engagement = await getBbsArticleEngagement(article.id)

  const heroMediaIndex = article.thumbnailUrl ? article.media.findIndex((media) => media.imageUrl === article.thumbnailUrl) : 0
  const additionalMedia = article.media.filter((_, index) => index !== heroMediaIndex)

  return (
    <div className="bbs-theme min-h-[calc(100vh-3.5rem)] bg-[var(--bbs-page)] px-0 py-0 text-[var(--bbs-text)] md:px-4 md:py-8">
        <article className="mx-auto max-w-3xl overflow-hidden bg-[var(--bbs-surface)] md:rounded-3xl md:border md:border-[var(--bbs-border)] md:shadow-xl">
        <header className="flex items-center gap-3 border-b border-[var(--bbs-border)] px-4 py-4 sm:px-6">
          <Link href="/bbs" aria-label="BBS 기사 목록으로 돌아가기" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-[#d7432d]">
            <ArrowLeft size={21} />
          </Link>
          <BbsLogo compact />
          <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-[var(--bbs-text)]">{article.title}</p>
            <p className="mt-0.5 text-[10px] text-[var(--bbs-subtle-text)]">{article.author}</p>
          </div>
          <BbsShareButton className="text-[#d7432d] hover:bg-[#d7432d]/10 hover:text-[#a82f23]" />
        </header>

        <main className="bg-[var(--bbs-surface)] px-5 pb-8 pt-7 sm:px-10 sm:pb-12 sm:pt-10">
          <h1 className="text-2xl font-black leading-tight tracking-tight text-[var(--bbs-text)] sm:text-3xl">{article.title}</h1>
          <div className="mt-4 space-y-1 text-xs text-[var(--bbs-subtle-text)]">
            <p>{article.author}</p>
            <time dateTime={article.approvedAt}>승인 {formatArticleDate(article.approvedAt)}</time>
          </div>
          <div className="my-6 h-px bg-[var(--bbs-border)]" />
          <BbsArticleVisual article={article} detail />
          {additionalMedia.length > 0 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {additionalMedia.map((media) => (
                <div key={media.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black">
                  <AppImage src={media.imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 384px" className="object-contain" />
                </div>
              ))}
            </div>
          )}
          <BbsArticleContent content={article.content} className="mt-7" />
          <BbsArticleInteractions articleId={article.id} initial={engagement} />
        </main>
        </article>
    </div>
  )
}
