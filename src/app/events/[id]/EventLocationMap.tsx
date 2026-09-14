'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const MapPinPicker = dynamic(() => import('@/components/report/MapPinPicker'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-zinc-900" />,
})

export default function EventLocationMap({ x, y }: { x: number; y: number }) {
  return (
    <div className="relative isolate z-0 h-72 overflow-hidden rounded-xl border border-zinc-800 sm:h-80">
      <MapPinPicker coords={{ lat: y, lng: x }} readOnly />
      <div className="absolute bottom-3 right-3 z-[1000]">
        <Link
          href={`/map?focus_x=${encodeURIComponent(x)}&focus_y=${encodeURIComponent(y)}`}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-amber-400 backdrop-blur transition-colors hover:bg-zinc-800"
        >
          전체 지도에서 보기
          <ArrowUpRight size={12} />
        </Link>
      </div>
    </div>
  )
}
