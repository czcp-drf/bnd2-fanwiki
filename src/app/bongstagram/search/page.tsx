import type { Metadata } from 'next'
import { getBongstagramDirectory } from '@/lib/bongstagram/public-data'
import { getBongstagramPostGridPage } from '@/lib/bongstagram/feed-data'
import BongstagramBottomNav from '../BongstagramBottomNav'
import BongstagramProfileSearch from './BongstagramProfileSearch'

export const metadata: Metadata = {
  title: '검색 · Bongstagram',
  description: 'Bongstagram 프로필 검색',
}

export default async function BongstagramSearchPage() {
  const [{ profiles, characters, streamers }, gridPage] = await Promise.all([getBongstagramDirectory(), getBongstagramPostGridPage()])

  return (
    <div className="bongstagram-theme">
      <div className="bongstagram-font min-h-screen bg-zinc-950 pb-20">
        <div className="mx-auto min-h-screen w-full max-w-[540px] border-x border-zinc-900 bg-zinc-950">
          <BongstagramProfileSearch
            profiles={profiles}
            characters={characters}
            streamers={streamers}
            posts={gridPage.posts}
            gridCursor={gridPage.nextCursor}
            gridHasMore={gridPage.hasMore}
          />
        </div>
      </div>
      <BongstagramBottomNav />
    </div>
  )
}
