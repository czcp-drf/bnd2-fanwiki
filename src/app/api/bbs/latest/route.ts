import { NextResponse } from 'next/server'
import { getLatestBbsArticle } from '@/lib/bbs/data'

export const revalidate = 86400

export async function GET() {
  const article = await getLatestBbsArticle()
  return NextResponse.json(
    { article },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    },
  )
}
