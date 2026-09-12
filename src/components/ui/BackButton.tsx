'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function BackButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className={
        iconOnly
          ? 'text-zinc-500 transition-colors hover:text-zinc-300 cursor-pointer'
          : 'inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer'
      }
    >
      <ChevronLeft size={iconOnly ? 20 : 16} />
      {!iconOnly && '뒤로가기'}
    </button>
  )
}
