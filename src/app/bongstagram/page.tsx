import type { Metadata } from 'next'
import Link from 'next/link'
import BongstagramStoryRail from './BongstagramStoryRail'
import BongstagramInfiniteFeed from './BongstagramInfiniteFeed'
import BongstagramBottomNav from './BongstagramBottomNav'
import { getBongstagramFeedPage, getBongstagramStoryFeed } from '@/lib/bongstagram/feed-data'
import {
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Send,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Bongstagram',
  description: '봉누도2 인게임 SNS Bongstagram',
}

export default async function BongstagramPage() {
  const [initialPage, stories] = await Promise.all([
    getBongstagramFeedPage(),
    getBongstagramStoryFeed(),
  ])
  const { posts } = initialPage

  return (
    <div className="bongstagram-theme">
      <div className="bongstagram-font min-h-[calc(100vh-3.5rem)] bg-zinc-950">
        <div className="mx-auto min-h-[calc(100vh-3.5rem)] w-full max-w-[540px] border-x border-zinc-900 bg-zinc-950 pb-20">
          <header className="flex h-16 items-center justify-between border-b border-zinc-800 px-5">
          <Link href="/bongstagram" className="inline-block origin-left scale-x-105 text-2xl font-medium leading-none tracking-tight text-white">
            Bongstagram
          </Link>
          <div className="flex items-center gap-4 text-zinc-300">
            <button type="button" aria-label="좋아요 알림" className="transition-colors hover:text-white">
              <Heart size={25} />
            </button>
            <button type="button" aria-label="메시지" className="transition-colors hover:text-white">
              <Send size={25} />
            </button>
          </div>
          </header>

        <BongstagramStoryRail stories={stories} />

        <main>
          {posts.length > 0 ? <BongstagramInfiniteFeed initialPosts={posts} initialCursor={initialPage.nextCursor} initialHasMore={initialPage.hasMore} /> : (
          <article className="border-b border-zinc-800">
            <header className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-fuchsia-500 to-amber-300 p-[2px]">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-200">차</div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">차수진</p>
                </div>
              </div>
              <div>
                <button type="button" className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-bold !text-white transition-colors hover:bg-sky-400">
                  팔로우
                </button>
              </div>
            </header>

            <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-fuchsia-950/20">
              <div className="flex max-w-[16rem] flex-col items-center gap-4 px-6 text-center">
                <div className="rounded-full border border-zinc-800 bg-zinc-900 p-4 text-fuchsia-300">
                  <ImageIcon size={30} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">게시물을 준비하고 있습니다.</p>
                  <p className="mt-1.5 text-xs leading-5 text-zinc-500">캐릭터별 Bongstagram 프로필과 게시물 데이터가 연결되면 이 영역에 사진이 표시됩니다.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-zinc-300">
                  <Heart size={23} />
                  <MessageCircle size={23} />
                  <Send size={22} />
                </div>
              </div>
              <p className="text-sm font-semibold text-zinc-200">피드 준비 중</p>
              <p className="text-sm text-zinc-300">봉누도2의 소식과 일상을 Bongstagram에서 만나보세요.</p>
            </div>
          </article>
          )}
        </main>

        <BongstagramBottomNav />
        </div>
      </div>
    </div>
  )
}
