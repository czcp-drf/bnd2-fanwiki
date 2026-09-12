import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Bell,
  Camera,
  Compass,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Plus,
  Search,
  UserRound,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Bonstagram',
  description: '봉누도2 인게임 SNS Bonstagram',
}

export default function BonstagramPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <section className="relative overflow-hidden rounded-3xl border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-950/50 via-zinc-900 to-zinc-900 px-6 py-8 sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="relative max-w-2xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-fuchsia-300">
              <Camera size={17} />
              <span>봉누도2 인게임 SNS</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Bonstagram</h1>
            <p className="max-w-xl text-sm leading-6 text-zinc-300 sm:text-base">
              봉누도2의 인물들이 남기는 사진과 소식을 한곳에서 확인하세요.
              기존 캐릭터에 연결된 프로필 이름이 SNS에 표시됩니다.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="#profile-guide"
                className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-400 px-4 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-fuchsia-300"
              >
                <Plus size={16} />
                Bonstagram 시작하기
              </Link>
              <span className="inline-flex items-center rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-2.5 text-sm text-zinc-400">
                피드 준비 중
              </span>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <main className="min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">피드</h2>
                <p className="mt-1 text-xs text-zinc-500">최근 게시물을 시간순으로 확인합니다.</p>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-600" aria-hidden="true">
                <Search size={17} />
                <Bell size={17} />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-4">
                <div className="h-9 w-9 rounded-full bg-zinc-800" />
                <div className="space-y-2">
                  <div className="h-2.5 w-24 rounded-full bg-zinc-800" />
                  <div className="h-2 w-16 rounded-full bg-zinc-800/70" />
                </div>
              </div>
              <div className="flex aspect-[4/3] items-center justify-center bg-zinc-950/60">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="rounded-full border border-zinc-800 bg-zinc-900 p-4 text-zinc-600">
                    <ImageIcon size={26} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-300">아직 게시물이 없습니다.</p>
                    <p className="mt-1 text-xs text-zinc-600">첫 번째 Bonstagram 게시물을 기다리고 있어요.</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 px-5 py-4 text-zinc-600">
                <Heart size={19} />
                <MessageCircle size={19} />
                <Compass size={19} />
              </div>
            </div>
          </main>

          <aside id="profile-guide" className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-full bg-fuchsia-400/10 p-2.5 text-fuchsia-300">
                <UserRound size={19} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Bonstagram 프로필</h2>
                <p className="mt-0.5 text-xs text-zinc-500">캐릭터당 하나의 프로필</p>
              </div>
            </div>

            <dl className="space-y-4 text-sm">
              <div>
                <dt className="mb-1 text-xs font-medium text-zinc-500">연결 캐릭터</dt>
                <dd className="text-fuchsia-300">캐릭터 고유 ID</dd>
                <p className="mt-1 text-xs leading-5 text-zinc-600">기존 캐릭터 고유 ID로 Bonstagram 프로필을 식별합니다.</p>
              </div>
              <div>
                <dt className="mb-1 text-xs font-medium text-zinc-500">프로필 이름</dt>
                <dd className="text-zinc-200">SNS에서 보여지는 닉네임</dd>
                <p className="mt-1 text-xs leading-5 text-zinc-600">한글과 영문을 모두 사용할 수 있습니다.</p>
              </div>
            </dl>

            <div className="mt-5 rounded-xl border border-fuchsia-400/10 bg-fuchsia-400/5 px-3.5 py-3 text-xs leading-5 text-zinc-400">
              캐릭터와 Bonstagram 프로필 연결 및 게시물 작성 기능은 다음 단계에서 연결합니다.
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
