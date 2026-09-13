import Image, { type ImageProps } from 'next/image'

type AppImageProps = Omit<ImageProps, 'src' | 'width' | 'height' | 'alt'> & {
  src: string
  alt?: string
  width?: number
  height?: number
}

export default function AppImage({ src, alt = '', width = 1000, height = 1000, fill, ...props }: AppImageProps) {
  if (fill) {
    return <Image src={src} alt={alt} fill unoptimized {...props} />
  }

  return <Image src={src} alt={alt} width={width} height={height} unoptimized {...props} />
}
