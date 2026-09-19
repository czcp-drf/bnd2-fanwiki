import AppImage from '@/components/ui/AppImage'
import type { BbsArticle } from '@/lib/bbs/articles'
import BbsLogo from './BbsLogo'
import BbsZoomableImage from './BbsZoomableImage'

const toneStyles = {
  info: 'from-[#8b2c27] via-[#d55c36] to-[#f0a048]',
  incident: 'from-[#324b5d] via-[#66899a] to-[#d5b68b]',
  economy: 'from-[#3e5546] via-[#8a9c68] to-[#d8bf82]',
  column: 'from-[#5e3d62] via-[#99729e] to-[#d6b07d]',
  other: 'from-[#3f4d60] via-[#70859a] to-[#c6a982]',
}

export default function BbsArticleVisual({ article, detail = false, compact = false }: { article: BbsArticle; detail?: boolean; compact?: boolean }) {
  const imageUrl = article.thumbnailUrl ?? article.media[0]?.imageUrl
  const aspectClass = compact ? 'relative m-2.5 self-center h-[68px] w-[86px] shrink-0 rounded-lg sm:m-0 sm:h-auto sm:w-auto sm:aspect-[16/9] sm:rounded-none' : detail ? 'relative rounded-xl' : 'relative aspect-[16/9]'

  return (
    <div className={`${aspectClass} isolate overflow-hidden bg-gradient-to-br ${toneStyles[article.categoryKey]}`}>
      {imageUrl ? (
        detail ? <BbsZoomableImage src={imageUrl} alt="기사 대표 이미지 확대" intrinsic previewClassName="max-w-full rounded-xl" sizes="(max-width: 768px) 100vw, 768px" loading="eager" /> : <AppImage src={imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 576px" unoptimized className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#ededed]">
          <BbsLogo compact className={detail ? 'scale-[1.5]' : compact ? 'scale-[0.9]' : 'scale-[1.2]'} />
        </div>
      )}
    </div>
  )
}
