'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function BbsArticleBackLink() {
  const searchParams = useSearchParams()
  const query = searchParams.toString()
  return (
    <Link href={`/bbs${query ? `?${query}` : ''}`} aria-label="BBS 기사 목록으로 돌아가기" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-[var(--bbs-accent-text)]">
      <ArrowLeft size={21} />
    </Link>
  )
}
