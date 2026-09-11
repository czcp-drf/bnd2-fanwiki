import { NextRequest, NextResponse } from 'next/server'
import { checkChannelLive, type LiveMap } from '@/lib/live/status'

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get('ids')
  if (!ids) return NextResponse.json({})
  const channelIds = [...new Set(ids.split(',').filter(Boolean))]
  if (channelIds.length > 20 || channelIds.some((id) => !/^[a-f0-9]{32}$/i.test(id))) {
    return NextResponse.json({ error: 'Invalid channel IDs' }, { status: 400 })
  }
  const entries = await Promise.all(channelIds.map(async (id) => [id, await checkChannelLive(id)] as const))
  const map: LiveMap = Object.fromEntries(entries)
  return NextResponse.json(map, { headers: { 'Cache-Control': 'no-store' } })
}
