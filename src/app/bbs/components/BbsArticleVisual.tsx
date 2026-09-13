import { Newspaper, Radio, Building2 } from 'lucide-react'
import type { BbsArticle } from '@/lib/bbs/articles'

const toneStyles = {
  broadcast: 'from-[#8b2c27] via-[#d55c36] to-[#f0a048]',
  city: 'from-[#324b5d] via-[#66899a] to-[#d5b68b]',
  field: 'from-[#3e5546] via-[#8a9c68] to-[#d8bf82]',
}

const toneIcons = {
  broadcast: Radio,
  city: Building2,
  field: Newspaper,
}

export default function BbsArticleVisual({ article, detail = false }: { article: BbsArticle; detail?: boolean }) {
  const Icon = toneIcons[article.imageTone]

  return (
    <div className={`relative isolate overflow-hidden bg-gradient-to-br ${toneStyles[article.imageTone]} ${detail ? 'aspect-[16/8] sm:aspect-[16/7]' : 'aspect-[16/9]'}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_28%),linear-gradient(135deg,transparent_45%,rgba(0,0,0,0.22))]" />
      <div className="absolute -bottom-14 -right-12 h-48 w-48 rounded-full border-[18px] border-white/15" />
      <div className="absolute -left-10 -top-16 h-48 w-48 rounded-full border-[22px] border-black/10" />
      <div className="relative flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-white">
        <Icon size={detail ? 34 : 26} strokeWidth={1.5} />
        <span className={`${detail ? 'text-3xl sm:text-4xl' : 'text-2xl'} font-black tracking-[0.18em]`}>BBS</span>
        <span className="max-w-md text-xs font-medium tracking-wide text-white/85">봉누도 곳곳의 소식을 전합니다</span>
      </div>
    </div>
  )
}
