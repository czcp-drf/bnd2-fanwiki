import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Heart, MessageCircle, Share2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import BbsArticleVisual from '../../components/BbsArticleVisual'
import BbsArticleContent from '../../components/BbsArticleContent'
import BbsLogo from '../../components/BbsLogo'
import { getBbsArticle } from '@/lib/bbs/articles'

type Props = {
  params: Promise<{ id: string }>
}

function formatArticleDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: false }).format(new Date(value))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const article = getBbsArticle(id)
  return article ? { title: article.title, description: article.summary } : { title: '기사를 찾을 수 없습니다' }
}

export default async function BbsArticlePage({ params }: Props) {
  const { id } = await params
  const article = getBbsArticle(id)
  if (!article) notFound()

  return (
    <div className="bbs-theme min-h-[calc(100vh-3.5rem)] bg-[var(--bbs-page)] px-0 py-0 text-[var(--bbs-text)] md:px-4 md:py-8">
        <article className="mx-auto max-w-3xl overflow-hidden bg-[var(--bbs-surface)] md:rounded-3xl md:border md:border-[var(--bbs-border)] md:shadow-xl">
        <header className="flex items-center gap-3 border-b border-[var(--bbs-border)] px-4 py-4 sm:px-6">
          <Link href="/bbs" aria-label="BBS 기사 목록으로 돌아가기" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-[#d7432d]">
            <ArrowLeft size={21} />
          </Link>
          <BbsLogo compact className="scale-[0.78] origin-left" />
          <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-[var(--bbs-text)]">{article.title}</p>
            <p className="mt-0.5 text-[10px] text-[var(--bbs-subtle-text)]">{article.author}</p>
          </div>
          <button type="button" aria-label="기사 공유" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#d7432d] transition-colors hover:bg-[#d7432d]/10">
            <Share2 size={18} />
          </button>
        </header>

        <main className="bg-[var(--bbs-surface)] px-5 pb-8 pt-7 sm:px-10 sm:pb-12 sm:pt-10">
          <div className="mb-5 flex items-center gap-2 text-xs font-semibold text-[#d7432d]">
            <span className="rounded-full bg-[#d7432d]/10 px-2.5 py-1">{article.category}</span>
            <time dateTime={article.approvedAt} className="font-medium text-[var(--bbs-subtle-text)]">승인 {formatArticleDate(article.approvedAt)}</time>
          </div>
          <h1 className="text-2xl font-black leading-tight tracking-tight text-[var(--bbs-text)] sm:text-3xl">{article.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--bbs-subtle-text)]">{article.summary}</p>
          <div className="my-6 h-px bg-[var(--bbs-border)]" />
          <BbsArticleVisual article={article} detail />
          <BbsArticleContent content={article.body.join('\n\n')} className="mt-7" />
          <div className="mt-8 flex items-center gap-5 border-t border-[var(--bbs-border)] pt-4 text-sm text-[var(--bbs-subtle-text)]">
            <span className="inline-flex items-center gap-1.5 text-[#e14b32]"><Heart size={18} fill="currentColor" />{article.likes}</span>
            <span className="inline-flex items-center gap-1.5"><MessageCircle size={18} />{article.comments}</span>
            <button type="button" aria-label="기사 공유" className="ml-auto cursor-pointer text-[#d7432d] transition-colors hover:text-[#a82f23]"><Share2 size={18} /></button>
          </div>
        </main>
        </article>
    </div>
  )
}
