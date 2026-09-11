import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '입문 가이드',
  description: '봉누도2 입문 가이드 — 준비 중입니다',
}

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-4">
      <p className="text-4xl">🚧</p>
      <h1 className="text-xl font-black text-white">준비 중입니다</h1>
      <p className="text-sm text-zinc-500">가이드 페이지는 현재 작성 중입니다. 조금만 기다려 주세요.</p>
    </div>
  )
}
