'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function BackButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
    >
      <ChevronLeft size={16} />
      뒤로가기
    </button>
  )
}
