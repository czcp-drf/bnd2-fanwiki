'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import AppImage from '@/components/ui/AppImage'

export default function BbsZoomableImage({ src, alt = '', previewClassName, sizes = '100vw', loading = 'lazy', intrinsic = false }: { src: string; alt?: string; previewClassName: string; sizes?: string; loading?: 'eager' | 'lazy'; intrinsic?: boolean }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`group relative block cursor-zoom-in overflow-hidden bg-black text-left ${intrinsic ? 'max-w-full' : 'w-full'} ${previewClassName}`} aria-label="이미지 확대">
        {intrinsic ? <AppImage src={src} alt={alt} width={1200} height={900} sizes={sizes} loading={loading} unoptimized className="h-auto max-w-full rounded-lg object-contain transition-transform duration-200 group-hover:scale-[1.015]" /> : <AppImage src={src} alt={alt} fill sizes={sizes} loading={loading} unoptimized className="object-contain transition-transform duration-200 group-hover:scale-[1.015]" />}
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label="이미지 확대 보기" onClick={() => setOpen(false)}>
          <div className="relative h-[min(90vh,56rem)] w-[min(94vw,72rem)]" onClick={(event) => event.stopPropagation()}>
            <AppImage src={src} alt={alt} fill sizes="94vw" unoptimized className="object-contain" />
            <button type="button" onClick={() => setOpen(false)} className="absolute right-0 top-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80" aria-label="이미지 확대 닫기"><X size={22} /></button>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
