import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Image as ImageIcon } from 'lucide-react'
import AppImage from '@/components/ui/AppImage'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBongstagramIpHash } from '@/lib/bongstagram/like-ip'
import { getBongstagramPost, getBongstagramPostEngagement } from '@/lib/bongstagram/public-data'
import BongstagramBottomNav from '../../BongstagramBottomNav'
import BongstagramBackButton from '../../BongstagramBackButton'
import BongstagramDisplayName from '../../BongstagramDisplayName'
import BongstagramFollowButton from '../../BongstagramFollowButton'
import BongstagramPostInteractions, { BongstagramLikeCountProvider } from '../../BongstagramPostInteractions'
import BongstagramProfileAvatar from '../../BongstagramProfileAvatar'
import BongstagramVideoPlayer from '../../BongstagramVideoPlayer'
import MediaCarousel from '../../MediaCarousel'

type Media = { id: string; media_type: 'image' | 'video'; media_url: string; sort_order: number }
type Post = { id: string; character_id: string; post_type: 'post' | 'story'; content: string; posted_at: string; media: Media[] }

async function getPostData(postId: string) {
  const data = await getBongstagramPost(postId)
  if (!data) notFound()

  const counts = await getPostCounts(data.post.id)

  return {
    post: {
      id: data.post.id,
      character_id: data.post.character_id,
      post_type: data.post.post_type,
      content: data.post.content,
      posted_at: data.post.posted_at,
      media: data.post.media,
    } satisfies Post,
    profile: data.profile,
    character: data.character,
    streamer: data.streamer,
    ...counts,
  }
}

async function getPostCounts(postId: string) {
  const adminSupabase = createAdminClient()
  const ipHash = await getBongstagramIpHash()
  const [{ likeCounts, commentCounts }, viewerLikesResult] = await Promise.all([
    getBongstagramPostEngagement([postId]),
    ipHash
      ? adminSupabase.from('bongstagram_post_likes').select('post_id').eq('post_id', postId).eq('ip_hash', ipHash)
      : Promise.resolve({ data: [], error: null }),
  ])

  return {
    likeCount: likeCounts[postId] ?? 0,
    commentCount: commentCounts[postId] ?? 0,
    likedByViewer: !viewerLikesResult.error && (viewerLikesResult.data ?? []).length > 0,
  }
}

function formatPostTime(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime())
  const minuteMs = 60 * 1000
  const day = 24 * 60 * 60 * 1000

  if (elapsed < minuteMs) return '방금 전'
  if (elapsed < day) {
    const hour = 60 * minuteMs
    if (elapsed < hour) return `${Math.floor(elapsed / minuteMs)}분 전`
    return `${Math.floor(elapsed / hour)}시간 전`
  }
  const parts = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' }).formatToParts(new Date(value))
  return `${parts.find((part) => part.type === 'month')?.value}월 ${parts.find((part) => part.type === 'day')?.value}일`
}

function PostCaption({ post, profileName, streamerName }: { post: Post; profileName: string; streamerName: string | null }) {
  const parts = post.content.split(/(#[^\s#]+)/g)
  return (
    <p className="whitespace-pre-wrap break-words text-sm text-zinc-300">
      <Link href={`/bongstagram/${post.character_id}`} className="font-bold text-zinc-200 transition-colors hover:text-fuchsia-300"><BongstagramDisplayName profileName={profileName} streamerName={streamerName} /></Link>{' '}
      {parts.map((part, index) => part.startsWith('#') ? <Link key={`${part}-${index}`} href={`/bongstagram/hashtag/${encodeURIComponent(part.slice(1))}`} className="text-sky-400 hover:underline">{part}</Link> : <span key={`${part}-${index}`}>{part}</span>)}
    </p>
  )
}

function PostMedia({ media, label }: { media: Media; label: string }) {
  return media.media_type === 'video'
    ? <BongstagramVideoPlayer src={media.media_url} label={label} />
    : <div className="relative w-full overflow-hidden bg-black" style={{ height: 'min(125vw, 675px)' }}><AppImage src={media.media_url} alt={`${label} 게시물`} width={540} height={675} className="h-full w-full object-contain" /></div>
}

export async function generateMetadata({ params }: { params: Promise<{ postId: string }> }): Promise<Metadata> {
  const { postId } = await params
  const data = await getPostData(postId)
  return { title: `${data.profile.profile_name} 게시물 · Bongstagram` }
}

export default async function BongstagramPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  const data = await getPostData(postId)

  return (
    <div className="bongstagram-theme">
      <div className="bongstagram-font min-h-screen bg-zinc-950 pb-20">
        <div className="mx-auto min-h-screen w-full max-w-[540px] border-x border-zinc-900 bg-zinc-950">
          <header className="relative flex h-16 items-center border-b border-zinc-800 px-5">
            <BongstagramBackButton />
            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">게시물</h1>
          </header>

          <article>
            <header className="flex items-center justify-between px-4 py-3">
              <Link href={`/bongstagram/${data.character.id}`} className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-bold text-zinc-200"><BongstagramProfileAvatar profileAvatarUrl={data.profile.avatar_url} streamerAvatarUrl={data.streamer?.profile_image_url} fallbackAvatarUrl={data.character.avatar_url} profileName={data.profile.profile_name} streamerName={data.streamer?.display_name} className="h-full w-full object-cover" /></div>
                <span className="truncate text-sm font-semibold text-zinc-200"><BongstagramDisplayName profileName={data.profile.profile_name} streamerName={data.streamer?.display_name} /></span>
              </Link>
              <BongstagramFollowButton characterId={data.character.id} />
            </header>

            {data.post.media.length > 0 ? <MediaCarousel>{data.post.media.map((media) => <div key={media.id} className="w-full min-w-0 max-w-full flex-none snap-center"><PostMedia media={media} label={data.profile.profile_name} /></div>)}</MediaCarousel> : <div className="flex min-h-56 items-center justify-center bg-black text-zinc-600"><ImageIcon size={28} /></div>}

            <div className="space-y-3 px-4 py-3">
              <BongstagramLikeCountProvider postIds={[data.post.id]} initialLikeCounts={{ [data.post.id]: data.likeCount }}><BongstagramPostInteractions postId={data.post.id} initialLikeCount={data.likeCount} initialCommentCount={data.commentCount} initialLiked={data.likedByViewer} caption={data.post.content ? <PostCaption post={data.post} profileName={data.profile.profile_name} streamerName={data.streamer?.display_name ?? null} /> : null} /></BongstagramLikeCountProvider>
              <p className="text-[11px] text-zinc-500">{formatPostTime(data.post.posted_at)}</p>
            </div>
          </article>
        </div>
      </div>
      <BongstagramBottomNav />
    </div>
  )
}
