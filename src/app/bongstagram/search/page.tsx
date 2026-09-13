import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import BongstagramBottomNav from '../BongstagramBottomNav'
import BongstagramProfileSearch from './BongstagramProfileSearch'

export const metadata: Metadata = {
  title: '검색 · Bongstagram',
  description: 'Bongstagram 프로필 검색',
}

export default async function BongstagramSearchPage() {
  const supabase = await createClient()
  const [{ data: profiles }, { data: characters }, { data: streamers }, { data: posts }] = await Promise.all([
    supabase.from('bongstagram_profiles').select('character_id, profile_name, avatar_url'),
    supabase.from('characters').select('id, name, avatar_url, streamer_id'),
    supabase.from('streamers').select('id, display_name, profile_image_url'),
    supabase.from('bongstagram_posts').select('id, character_id, post_type, posted_at, bongstagram_post_media ( media_type, media_url, sort_order )').eq('post_type', 'post').order('posted_at', { ascending: false }),
  ])

  type PostRow = { id: string; character_id: string; post_type: 'post' | 'story'; posted_at: string; bongstagram_post_media: { media_type: 'image' | 'video'; media_url: string; sort_order: number }[] }
  const gridPosts = ((posts ?? []) as PostRow[]).flatMap((post) => {
    const media = [...(post.bongstagram_post_media ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]
    return media ? [{ id: post.id, character_id: post.character_id, media_type: media.media_type, media_url: media.media_url }] : []
  })

  return (
    <div className="bongstagram-theme">
      <div className="bongstagram-font min-h-screen bg-zinc-950 pb-20">
        <div className="mx-auto min-h-screen w-full max-w-[540px] border-x border-zinc-900 bg-zinc-950">
          <BongstagramProfileSearch
            profiles={profiles ?? []}
            characters={characters ?? []}
            streamers={streamers ?? []}
            posts={gridPosts}
          />
        </div>
      </div>
      <BongstagramBottomNav />
    </div>
  )
}
