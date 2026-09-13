import Link from 'next/link'
import { Play } from 'lucide-react'
import AppImage from '@/components/ui/AppImage'

export type BongstagramGridPost = {
  id: string
  character_id: string
  media_type: 'image' | 'video'
  media_url: string
}

export default function BongstagramPostGrid({ posts }: { posts: BongstagramGridPost[] }) {
  return posts.length === 0 ? (
    <p className="px-5 py-20 text-center text-sm text-zinc-600">등록된 게시물이 없습니다.</p>
  ) : (
    <div className="grid grid-cols-3 gap-px bg-zinc-900">
      {posts.map((post) => (
        <Link key={post.id} href={`/bongstagram/post/${post.id}`} aria-label="게시물 상세 보기" className="relative block aspect-square overflow-hidden bg-black">
          {post.media_type === 'video' ? <video muted playsInline preload="metadata" src={post.media_url} className="h-full w-full object-cover" aria-label="동영상 게시물" /> : <AppImage src={post.media_url} alt="게시물" width={180} height={180} className="h-full w-full object-cover" />}
          {post.media_type === 'video' && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md bg-white text-zinc-950 shadow-sm"><Play size={14} fill="currentColor" strokeWidth={1.5} /></span>}
        </Link>
      ))}
    </div>
  )
}
