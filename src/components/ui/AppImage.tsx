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

export default function AppImage({ src, alt = '', width = 1000, height = 1000, fill, sizes, quality = 75, ...props }: AppImageProps) {
  const optimized = isOptimizableSource(src)
  const imageSizes = sizes ?? (fill ? '100vw' : `${Math.min(width, 1000)}px`)

  if (fill) {
    return <Image src={src} alt={alt} fill sizes={imageSizes} quality={quality} unoptimized={!optimized} {...props} />
  }

  return <Image src={src} alt={alt} width={width} height={height} sizes={imageSizes} quality={quality} unoptimized={!optimized} {...props} />
}
