import type { Metadata } from 'next'
import { getBongstagramDirectory } from '@/lib/bongstagram/public-data'
import BongstagramBottomNav from '../BongstagramBottomNav'
import BongstagramMyProfile from './BongstagramMyProfile'

export const metadata: Metadata = {
  title: '내 프로필 · Bongstagram',
  description: 'Bongstagram 내 프로필과 팔로잉 목록',
}

export default async function BongstagramMyProfilePage() {
  const { profiles, characters, streamers } = await getBongstagramDirectory()

  return (
    <div className="bongstagram-theme">
      <div className="bongstagram-font min-h-[calc(100dvh-3.5rem)] bg-zinc-950">
        <div className="mx-auto min-h-[calc(100dvh-3.5rem)] w-full max-w-[540px] border-x border-zinc-900 bg-zinc-950 pb-20">
          <BongstagramMyProfile profiles={profiles} characters={characters} streamers={streamers} />
        </div>
      </div>
      <BongstagramBottomNav />
    </div>
  )
}
