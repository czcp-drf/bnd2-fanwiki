import type { Metadata } from 'next'
import { getBongstagramDirectory } from '@/lib/bongstagram/public-data'
import BongstagramBottomNav from '../BongstagramBottomNav'
import BongstagramProfileSearch from '../search/BongstagramProfileSearch'

export const metadata: Metadata = {
  title: '프로필 · Bongstagram',
  description: 'Bongstagram 프로필 목록',
}

export default async function BongstagramProfilesPage() {
  const { profiles, characters, streamers } = await getBongstagramDirectory()

  return (
    <div className="bongstagram-theme">
      <div className="bongstagram-font min-h-[calc(100dvh-3.5rem)] bg-zinc-950">
        <div className="mx-auto min-h-[calc(100dvh-3.5rem)] w-full max-w-[540px] border-x border-zinc-900 bg-zinc-950 pb-20">
          <header className="flex h-16 items-center border-b border-zinc-800 px-5"><h1 className="text-xl font-medium tracking-tight text-white">프로필</h1></header>
          <BongstagramProfileSearch profiles={profiles} characters={characters} streamers={streamers} posts={[]} />
        </div>
      </div>
      <BongstagramBottomNav />
    </div>
  )
}
