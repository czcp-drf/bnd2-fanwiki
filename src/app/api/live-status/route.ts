import { NextRequest, NextResponse } from 'next/server'
import { checkChannelLive, type LiveMap } from '@/lib/live/status'
import { LIVE_ENABLED } from '@/lib/live/config'

export async function GET(req: NextRequest) {
  if (!LIVE_ENABLED) {
    return NextResponse.json({ error: 'Live status is temporarily disabled' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '3600' },
    })
  }
  const ids = req.nextUrl.searchParams.get('ids')
  if (!ids) return NextResponse.json({})
  const channelIds = [...new Set(ids.split(',').filter(Boolean))]
  if (channelIds.length > 20 || channelIds.some((id) => !/^[a-f0-9]{32}$/i.test(id))) {
    return NextResponse.json({ error: 'Invalid channel IDs' }, { status: 400 })
  }
  const entries = await Promise.all(channelIds.map(async (id) => [id, await checkChannelLive(id)] as const))
  const map: LiveMap = Object.fromEntries(entries)
  return NextResponse.json(map, { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } })
}
