'use client'

import dynamic from 'next/dynamic'

const MapPinPicker = dynamic(() => import('@/components/report/MapPinPicker'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-zinc-900" />,
})

export default function EventLocationMap({ x, y }: { x: number; y: number }) {
  return (
    <div className="h-72 overflow-hidden rounded-xl border border-zinc-800 sm:h-80">
      <MapPinPicker coords={{ lat: y, lng: x }} readOnly />
    </div>
  )
}
