'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function EventBackLink() {
  const searchParams = useSearchParams()
  const query = searchParams.toString()
  return (
    <Link href={`/events${query ? `?${query}` : ''}`} aria-label="사건 목록으로 이동" className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-300">
      <ChevronLeft size={16} />
      목록으로
    </Link>
  )
}
