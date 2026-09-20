import { NextResponse } from 'next/server'
import { getPublishedBbsListRevision } from '@/lib/bbs/data'

export async function GET() {
  try {
    const revision = await getPublishedBbsListRevision()
    return NextResponse.json(
      { revision },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('BBS list revision check failed:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'BBS 목록 버전을 확인하지 못했습니다.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
