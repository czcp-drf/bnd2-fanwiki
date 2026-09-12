import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Plus,
  Search,
  Send,
  SquarePlus,
  UserRound,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Bongstagram',
  description: '봉누도2 인게임 SNS Bongstagram',
}

const storyPreviews = [
  { label: '명충쇠', mark: '명', tone: 'from-amber-300 via-pink-500 to-fuchsia-600' },
  { label: 'zzya', mark: 'Z', tone: 'from-orange-300 via-fuchsia-500 to-violet-600' },
  { label: '김형순', mark: '김', tone: 'from-fuchsia-400 via-violet-500 to-sky-500' },
  { label: '차수진', mark: '차', tone: 'from-pink-400 via-red-400 to-orange-300' },
]

function StoryBubble({
  label,
  mark,
  tone,
  mine = false,
}: {
  label: string
  mark: string
  tone?: string
  mine?: boolean
}) {
  return (
    <div className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5">
      <div className={`relative rounded-full ${mine ? '' : 'bg-gradient-to-tr p-[2px] from-zinc-800 to-zinc-700'}`}>
        {tone && <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${tone}`} />}
        <div className={`bonstagram-story-avatar relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full text-xl font-bold text-zinc-200 ${mine ? '' : 'border-2 border-zinc-950'}`}>
          {mark}
        </div>
        {mine && (
          <span className="bonstagram-story-add absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full">
            <Plus size={12} strokeWidth={3} />
          </span>
        )}
      </div>
      <span className="max-w-[4.5rem] truncate text-[11px] text-zinc-400">{label}</span>
    </div>
  )
}

function FilledHomeIcon({ size = 23 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.3 10.3 12 2.5l9.7 7.8v10.2h-6.2v-6.4H8.5v6.4H2.3V10.3Z" />
    </svg>
  )
}

function BottomNav() {
  return (
    <nav className="flex items-center justify-around border-t border-zinc-800 bg-zinc-950/95 px-3 py-3 backdrop-blur" aria-label="Bongstagram 메뉴">
      <Link href="/bonstagram" aria-label="홈" className="text-white">
        <FilledHomeIcon />
      </Link>
      <button type="button" aria-label="검색" className="text-zinc-500 transition-colors hover:text-zinc-200">
        <Search size={23} />
      </button>
      <button type="button" aria-label="게시물 작성" className="text-zinc-500 transition-colors hover:text-zinc-200">
        <SquarePlus size={24} strokeWidth={1.8} />
      </button>
      <button type="button" aria-label="프로필" className="text-zinc-500 transition-colors hover:text-zinc-200">
        <UserRound size={22} strokeWidth={2.2} />
      </button>
    </nav>
  )
}

export default function BonstagramPage() {
  return (
    <div className="bonstagram-theme">
      <div className="bonstagram-font min-h-[calc(100vh-3.5rem)] bg-zinc-950">
        <div className="mx-auto min-h-[calc(100vh-3.5rem)] w-full max-w-[540px] border-x border-zinc-900 bg-zinc-950">
          <header className="flex h-16 items-center justify-between border-b border-zinc-800 px-5">
          <Link href="/bonstagram" className="inline-block origin-left scale-x-105 text-2xl font-medium leading-none tracking-tight text-white">
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

        <section className="flex gap-3 overflow-x-auto border-b border-zinc-800 px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="스토리">
          <StoryBubble label="내 스토리" mark="D" mine />
          {storyPreviews.map((story) => (
            <StoryBubble key={story.label} {...story} />
          ))}
        </section>

        <main>
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
        </main>

        <BottomNav />
        </div>
      </div>
    </div>
  )
}
