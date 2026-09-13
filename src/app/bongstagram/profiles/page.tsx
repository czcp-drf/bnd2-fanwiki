import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import BongstagramBottomNav from '../BongstagramBottomNav'
import BongstagramProfileSearch from '../search/BongstagramProfileSearch'

export const metadata: Metadata = {
  title: '프로필 · Bongstagram',
  description: 'Bongstagram 프로필 목록',
}

export default async function BongstagramProfilesPage() {
  const supabase = await createClient()
  const [{ data: profiles }, { data: characters }, { data: streamers }] = await Promise.all([
    supabase.from('bongstagram_profiles').select('character_id, profile_name, avatar_url'),
    supabase.from('characters').select('id, name, avatar_url, streamer_id'),
    supabase.from('streamers').select('id, display_name, profile_image_url'),
  ])

  return (
    <div className="bongstagram-theme">
      <div className="bongstagram-font min-h-screen bg-zinc-950 pb-20">
        <div className="mx-auto min-h-screen w-full max-w-[540px] border-x border-zinc-900 bg-zinc-950">
          <header className="flex h-16 items-center border-b border-zinc-800 px-5"><h1 className="text-xl font-medium tracking-tight text-white">프로필</h1></header>
          <BongstagramProfileSearch profiles={profiles ?? []} characters={characters ?? []} streamers={streamers ?? []} posts={[]} />
        </div>
      </div>
      <BongstagramBottomNav />
    </div>
  )
}
