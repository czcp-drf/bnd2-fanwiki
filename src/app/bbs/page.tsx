import type { Metadata } from 'next'
import BbsArticleCard from './components/BbsArticleCard'
import BbsCategoryNav from './components/BbsCategoryNav'
import BbsHeader from './components/BbsHeader'
import { BBS_ARTICLES, BBS_CATEGORIES, type BbsCategory } from '@/lib/bbs/articles'

export const metadata: Metadata = {
  title: 'BBS',
  description: '봉누도 방송국 BBS의 최신 기사와 소식',
}

type Props = {
  searchParams: Promise<{ category?: string }>
}

export default async function BbsPage({ searchParams }: Props) {
  const { category = '전체' } = await searchParams
  const activeCategory = BBS_CATEGORIES.includes(category as BbsCategory) ? category as BbsCategory : '전체'
  const articles = activeCategory === '전체'
    ? BBS_ARTICLES
    : BBS_ARTICLES.filter((article) => article.category === activeCategory)

  return (
    <div className="bbs-theme min-h-[calc(100vh-3.5rem)] bg-[var(--bbs-page)] text-[var(--bbs-text)] md:px-4 md:py-8">
        <div className="mx-auto max-w-6xl overflow-hidden md:rounded-3xl md:border md:border-[var(--bbs-border)] md:bg-[var(--bbs-surface)] md:shadow-xl">
          <BbsHeader />
          <main className="space-y-4 px-4 pb-28 pt-4 sm:px-6 sm:pb-28 sm:pt-6 md:px-8 md:pb-8">
            {articles.length === 0 ? (
              <div className="rounded-2xl border border-[var(--bbs-border)] bg-[var(--bbs-card)] px-5 py-20 text-center text-sm text-[var(--bbs-subtle-text)]">등록된 기사가 없습니다.</div>
            ) : (
              <section aria-label="BBS 기사 목록" className="grid gap-4 md:grid-cols-2">
                {articles.map((article) => <BbsArticleCard key={article.id} article={article} />)}
              </section>
            )}
          </main>
          <BbsCategoryNav activeCategory={activeCategory} />
        </div>
    </div>
  )
}
