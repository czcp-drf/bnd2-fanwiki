import { NextResponse } from 'next/server'
import { getLatestBbsArticle } from '@/lib/bbs/data'

export const revalidate = 60

export async function GET() {
  const article = await getLatestBbsArticle()
  return NextResponse.json(
    { article },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    },
  )
}
