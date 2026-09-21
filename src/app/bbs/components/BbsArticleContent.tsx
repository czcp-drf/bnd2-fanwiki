import type { ImgHTMLAttributes, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import BbsZoomableImage from './BbsZoomableImage'
import BbsVideoPlayer from './BbsVideoPlayer'
import { isAllowedBbsVideoUrl } from '@/lib/bbs/media-url'

const markdownComponents = {
  h1: ({ children }: { children?: ReactNode }) => <h1 className="mt-8 text-2xl font-black leading-tight tracking-tight first:mt-0 sm:text-3xl">{children}</h1>,
  h2: ({ children }: { children?: ReactNode }) => <h2 className="mt-7 text-xl font-bold leading-tight tracking-tight first:mt-0 sm:text-2xl">{children}</h2>,
  h3: ({ children }: { children?: ReactNode }) => <h3 className="mt-6 text-lg font-bold leading-tight first:mt-0 sm:text-xl">{children}</h3>,
  p: ({ children }: { children?: ReactNode }) => <p className="whitespace-pre-wrap break-words">{children}</p>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="list-decimal space-y-1 pl-6">{children}</ol>,
  li: ({ children }: { children?: ReactNode }) => <li className="pl-1">{children}</li>,
  strong: ({ children }: { children?: ReactNode }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }: { children?: ReactNode }) => <em className="italic">{children}</em>,
  del: ({ children }: { children?: ReactNode }) => <del className="text-[var(--bbs-subtle-text)]">{children}</del>,
  a: ({ children, href }: { children?: ReactNode; href?: string }) => isAllowedBbsVideoUrl(href ?? '')
    ? <BbsVideoPlayer src={href ?? ''} />
    : <a href={href} className="text-[var(--bbs-accent-text)] underline underline-offset-2" target="_blank" rel="noreferrer">{children}</a>,
  img: ({ src, alt }: ImgHTMLAttributes<HTMLImageElement>) => typeof src === 'string' ? <BbsZoomableImage src={src} alt={alt ?? ''} intrinsic previewClassName="max-w-full rounded-xl" sizes="(max-width: 768px) 100vw, 768px" /> : null,
}

export default function BbsArticleContent({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div className={`space-y-5 text-[15px] leading-[1.9] text-[var(--bbs-text)] sm:text-base ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  )
}
