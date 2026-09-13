import type { Metadata } from 'next'
import BssArticleCard from './components/BssArticleCard'
import BssCategoryNav from './components/BssCategoryNav'
import BssHeader from './components/BssHeader'
import { BSS_ARTICLES, BSS_CATEGORIES, type BssCategory } from '@/lib/bss/articles'

export const metadata: Metadata = {
  title: 'BBS',
  description: '봉누도 방송국 BBS의 최신 기사와 소식',
}

type Props = {
  searchParams: Promise<{ category?: string }>
}

export default async function BssPage({ searchParams }: Props) {
  const { category = '전체' } = await searchParams
  const activeCategory = BSS_CATEGORIES.includes(category as BssCategory) ? category as BssCategory : '전체'
  const articles = activeCategory === '전체'
    ? BSS_ARTICLES
    : BSS_ARTICLES.filter((article) => article.category === activeCategory)

  return (
    <div className="bss-theme min-h-[calc(100vh-3.5rem)] bg-[var(--bss-page)] text-[var(--bss-text)] md:px-4 md:py-8">
        <div className="mx-auto max-w-6xl overflow-hidden md:rounded-3xl md:border md:border-[var(--bss-border)] md:bg-[var(--bss-surface)] md:shadow-xl">
          <BssHeader />
          <main className="space-y-4 px-4 pb-28 pt-4 sm:px-6 sm:pb-28 sm:pt-6 md:px-8 md:pb-8">
            {articles.length === 0 ? (
              <div className="rounded-2xl border border-[var(--bss-border)] bg-[var(--bss-card)] px-5 py-20 text-center text-sm text-[var(--bss-subtle-text)]">등록된 기사가 없습니다.</div>
            ) : (
              <section aria-label="BBS 기사 목록" className="grid gap-4 md:grid-cols-2">
                {articles.map((article) => <BssArticleCard key={article.id} article={article} />)}
              </section>
            )}
          </main>
          <BssCategoryNav activeCategory={activeCategory} />
        </div>
    </div>
  )
}
