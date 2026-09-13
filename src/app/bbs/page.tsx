import type { Metadata } from 'next'
import BbsArticleCard from './components/BbsArticleCard'
import BbsCategoryNav from './components/BbsCategoryNav'
import BbsHeader from './components/BbsHeader'
import BbsPagination from './components/BbsPagination'
import { BBS_CATEGORIES, type BbsCategory } from '@/lib/bbs/articles'
import { getBbsReporterOptions, getPublishedBbsArticlesPage } from '@/lib/bbs/data'

export const metadata: Metadata = {
  title: 'BBS',
  description: '봉누도 방송국 BBS의 최신 기사와 소식',
}

type Props = {
  searchParams: Promise<{ category?: string; reporter?: string | string[]; page?: string }>
}

export default async function BbsPage({ searchParams }: Props) {
  const { category = '전체', reporter = '', page = '1' } = await searchParams
  const activeCategory = BBS_CATEGORIES.includes(category as BbsCategory) ? category as BbsCategory : '전체'
  const reporterValue = Array.isArray(reporter) ? reporter.join(',') : reporter
  const activeReporterIds = [...new Set(reporterValue.split(',').map((value) => value.trim()).filter(Boolean))]
  const parsedPage = Number.parseInt(page, 10)
  const requestedPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const [articlePage, reporters] = await Promise.all([
    getPublishedBbsArticlesPage(activeCategory === '전체' ? undefined : activeCategory, activeReporterIds.length ? activeReporterIds : undefined, requestedPage),
    getBbsReporterOptions(),
  ])

  return (
    <div className="bbs-theme h-[calc(100vh-3.5rem)] overflow-y-auto bg-[var(--bbs-page)] text-[var(--bbs-text)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:min-h-[calc(100vh-3.5rem)] md:h-auto md:overflow-visible md:px-4 md:py-8">
        <div className="mx-auto max-w-6xl md:flex md:h-[calc(100vh-10.5rem)] md:flex-col md:overflow-hidden md:rounded-3xl md:border md:border-[var(--bbs-border)] md:bg-[var(--bbs-surface)] md:shadow-xl">
          <BbsHeader activeCategory={activeCategory} activeReporterIds={activeReporterIds} reporters={reporters} />
          <main className="space-y-4 px-4 pb-32 pt-4 sm:px-6 sm:pb-32 sm:pt-6 md:min-h-0 md:flex-1 md:overflow-y-auto md:px-8 md:pb-32 md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden">
            {articlePage.total === 0 ? (
              <div className="rounded-2xl border border-[var(--bbs-border)] bg-[var(--bbs-card)] px-5 py-20 text-center text-sm text-[var(--bbs-subtle-text)]">등록된 기사가 없습니다.</div>
            ) : (
              <>
                <section aria-label="BBS 기사 목록" className="grid gap-4 md:grid-cols-2">
                  {articlePage.articles.map((article) => <BbsArticleCard key={article.id} article={article} />)}
                </section>
                <BbsPagination currentPage={Math.min(articlePage.page, articlePage.totalPages)} totalPages={articlePage.totalPages} category={activeCategory} reporterIds={activeReporterIds} />
              </>
            )}
          </main>
          <BbsCategoryNav activeCategory={activeCategory} reporterIds={activeReporterIds} />
        </div>
    </div>
  )
}
