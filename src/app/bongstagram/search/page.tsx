import type { Metadata } from 'next'
import { getBongstagramDirectory, getBongstagramPosts } from '@/lib/bongstagram/public-data'
import BongstagramBottomNav from '../BongstagramBottomNav'
import BongstagramProfileSearch from './BongstagramProfileSearch'

export const metadata: Metadata = {
  title: '검색 · Bongstagram',
  description: 'Bongstagram 프로필 검색',
}

export default async function BongstagramSearchPage() {
  const [{ profiles, characters, streamers }, posts] = await Promise.all([getBongstagramDirectory(), getBongstagramPosts('post')])
  const gridPosts = posts.flatMap((post) => {
    const media = post.media[0]
    return media ? [{ id: post.id, character_id: post.character_id, media_type: media.media_type, media_url: media.media_url }] : []
  })

  return (
    <div className="bongstagram-theme">
      <div className="bongstagram-font min-h-screen bg-zinc-950 pb-20">
        <div className="mx-auto min-h-screen w-full max-w-[540px] border-x border-zinc-900 bg-zinc-950">
          <BongstagramProfileSearch
            profiles={profiles}
            characters={characters}
            streamers={streamers}
            posts={gridPosts}
          />
        </div>
      </div>
      <BongstagramBottomNav />
    </div>
  )
}
