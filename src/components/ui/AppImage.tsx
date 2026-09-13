'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'

type AppImageProps = Omit<ImageProps, 'src' | 'width' | 'height' | 'alt'> & {
  src: string
  alt?: string
  width?: number
  height?: number
}

function isOptimizableSource(src: string) {
  if (src.startsWith('/')) return true

  try {
    const sourceUrl = new URL(src)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) return false

    return sourceUrl.origin === new URL(supabaseUrl).origin
      && sourceUrl.pathname.startsWith('/storage/v1/object/')
  } catch {
    return false
  }
}

export default function AppImage({ src, alt = '', width = 1000, height = 1000, fill, sizes, quality = 75, unoptimized = false, onError, ...props }: AppImageProps) {
  const [useOriginal, setUseOriginal] = useState(false)
  const imageSrc = src.trim()
  const optimized = isOptimizableSource(imageSrc)
  const imageSizes = sizes ?? (fill ? '100vw' : `${Math.min(width, 1000)}px`)
  const handleError: NonNullable<ImageProps['onError']> = (event) => {
    if (optimized && !useOriginal) {
      setUseOriginal(true)
    }
    onError?.(event)
  }

  if (fill) {
    return <Image src={imageSrc} alt={alt} fill sizes={imageSizes} quality={quality} unoptimized={unoptimized || !optimized || useOriginal} onError={handleError} {...props} />
  }

  return <Image src={imageSrc} alt={alt} width={width} height={height} sizes={imageSizes} quality={quality} unoptimized={unoptimized || !optimized || useOriginal} onError={handleError} {...props} />
}
