import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getLiveStreamers } from '@/lib/data/live-streamers'
import { getOrganizationFilterOptions } from '@/lib/data/organizations'
import CharacterFilters from '@/components/characters/CharacterFilters'
import StreamerListWithLive from '@/components/streamers/StreamerListWithLive'
import LiveDataError from '@/components/live/LiveDataError'

export const metadata: Metadata = {
  title: '라이브',
  description: '현재 방송 중인 봉누도2 스트리머 현황',
}


type Props = {
  searchParams: Promise<{ org?: string; sort?: string }>
}

export default async function LivePage({ searchParams }: Props) {
  const { org = '', sort = 'name' } = await searchParams
  const [organizations, streamers] = await Promise.all([
    getOrganizationFilterOptions(),
    getLiveStreamers(org, sort).catch(() => null),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          <h1 className="text-2xl font-black text-white">라이브</h1>
        </div>
        <p className="text-sm text-zinc-500">
            현재 방송 중인 스트리머를 확인할 수 있습니다. 빨간약을 켜면 스트리머 정보가 함께 표시됩니다.
        </p>
        </div>
      </div>

      <Suspense>
        <CharacterFilters
          organizations={organizations}
          basePath="/live"
          showStatus={false}
        />
      </Suspense>

      {streamers ? <StreamerListWithLive streamers={streamers} /> : <LiveDataError />}
    </div>
  )
}
