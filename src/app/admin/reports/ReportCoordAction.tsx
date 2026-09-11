'use client'

import { useState, useTransition } from 'react'
import { MapPin, Plus, Check } from 'lucide-react'
import { addMapLocation } from '../map/actions'

function parseCoords(content: string): { x: number; y: number } | null {
  const match = content.match(/\[지도 좌표\] X: ([-\d.]+), Y: ([-\d.]+)/)
  if (!match) return null
  const x = parseFloat(match[1])
  const y = parseFloat(match[2])
  if (isNaN(x) || isNaN(y)) return null
  return { x, y }
}

export default function ReportCoordAction({ content, title }: { content: string; title: string }) {
  const parsed = parseCoords(content)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(title)
  const [label, setLabel] = useState('')
  const [color, setColor] = useState('#facc15')
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!parsed) return null
  const coords = parsed

  function handleAdd() {
    if (!name.trim()) return
    startTransition(async () => {
      await addMapLocation({ name: name.trim(), label: label.trim() || null, description: null, color, x: coords.x, y: coords.y })
      setDone(true)
      setOpen(false)
    })
  }

  if (done) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-400">
        <Check size={12} />
        작업 위치에 추가됨
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-400">
          <MapPin size={10} />
          X: {coords.x.toFixed(1)}, Y: {coords.y.toFixed(1)}
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-amber-400/40 hover:text-amber-400"
          >
            <Plus size={11} />
            작업 위치로 추가
          </button>
        )}
      </div>

      {open && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="위치 이름 *"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="라벨 (예: 광산, 청소)"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent" />
            <span className="text-[10px] text-zinc-500">마커 색상</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={isPending || !name.trim()}
              className="flex-1 rounded bg-amber-400 py-1.5 text-xs font-semibold text-zinc-900 transition-colors hover:bg-amber-300 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? '추가 중…' : '추가'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
