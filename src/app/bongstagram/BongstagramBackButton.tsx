'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BongstagramBackButton({ label = '이전 페이지로 돌아가기' }: { label?: string }) {
  const router = useRouter()

  return (
    <button type="button" onClick={() => router.back()} aria-label={label} className="cursor-pointer text-zinc-300 transition-colors hover:text-white">
      <ArrowLeft size={23} />
    </button>
  )
}
