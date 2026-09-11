export const revalidate = 60

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { Streamer } from '@/types/database'
import StreamerFilters from '@/components/streamers/StreamerFilters'
import StreamerListWithLive, { type StreamerItem } from '@/components/streamers/StreamerListWithLive'

type StreamerWithCharacters = Streamer & {
  characters: Array<{
    id: string
    name: string
    job: string | null
    status: string
  }>
}

export const metadata: Metadata = {
  title: '스트리머',
  description: '봉누도2 서버에 참여하는 스트리머 목록',
}

async function getStreamers(sort: string): Promise<StreamerWithCharacters[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('streamers')
    .select(`
      *,
      characters (
        id,
        name,
        job,
        status
      )
    `)
    .order(
      sort === 'latest' || sort === 'oldest' ? 'created_at' : 'display_name',
      { ascending: sort === 'name' || sort === 'oldest' }
    )

  return (data ?? []) as unknown as StreamerWithCharacters[]
}

type Props = { searchParams: Promise<{ sort?: string }> }

export default async function StreamersPage({ searchParams }: Props) {
  const { sort = 'name' } = await searchParams
  const streamers = await getStreamers(sort)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white">스트리머</h1>
          <p className="text-sm text-zinc-500">봉누도2 서버에 참여하는 스트리머 목록입니다.</p>
        </div>
        <Suspense>
          <StreamerFilters />
        </Suspense>
      </div>

        <StreamerListWithLive streamers={streamers as unknown as StreamerItem[]} liveStatus={false} />
    </div>
  )
}
