import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'

export const revalidate = 86400

const PAGE_SIZE = 12
const eventTypes = new Set(['war', 'crime', 'political', 'social', 'accident', 'highlight', 'other'])

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') ?? ''
  const offsetValue = Number(request.nextUrl.searchParams.get('offset') ?? '0')
  const offset = Number.isInteger(offsetValue) && offsetValue >= 0 ? offsetValue : 0

  if (type && !eventTypes.has(type)) return NextResponse.json({ error: '잘못된 사건 유형입니다.' }, { status: 400 })

  const supabase = createPublicClient()
  let query = supabase
    .from('events')
    .select('id, title, summary, content, type, thumbnail_url, occurred_at, is_published, location_x, location_y, created_at, updated_at', { count: 'exact' })
    .eq('is_published', true)
    .order('occurred_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (type) query = query.eq('type', type)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: '사건 목록을 불러오지 못했습니다.' }, { status: 500 })

  return NextResponse.json(
    { events: data ?? [], total: count ?? 0, hasMore: offset + (data?.length ?? 0) < (count ?? 0) },
    { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' } },
  )
}
