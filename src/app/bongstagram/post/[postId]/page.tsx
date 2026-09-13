import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Image as ImageIcon } from 'lucide-react'
import AppImage from '@/components/ui/AppImage'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getBongstagramIpHash } from '@/lib/bongstagram/like-ip'
import BongstagramBottomNav from '../../BongstagramBottomNav'
import BongstagramBackButton from '../../BongstagramBackButton'
import BongstagramDisplayName from '../../BongstagramDisplayName'
import BongstagramFollowButton from '../../BongstagramFollowButton'
import BongstagramPostInteractions from '../../BongstagramPostInteractions'
import BongstagramProfileAvatar from '../../BongstagramProfileAvatar'
import BongstagramVideoPlayer from '../../BongstagramVideoPlayer'
import MediaCarousel from '../../MediaCarousel'

type Media = { id: string; media_type: 'image' | 'video'; media_url: string; sort_order: number }
type Post = { id: string; character_id: string; post_type: 'post' | 'story'; content: string; posted_at: string; media: Media[] }
type Profile = { character_id: string; profile_name: string; avatar_url: string | null }
type Character = { id: string; streamer_id: string | null; name: string; avatar_url: string | null }
type Streamer = { display_name: string; profile_image_url: string | null } | null

async function getPostData(postId: string) {
  const supabase = await createClient()
  const { data: post } = await supabase.from('bongstagram_posts').select('id, character_id, post_type, content, posted_at, bongstagram_post_media ( id, media_type, media_url, sort_order )').eq('id', postId).eq('post_type', 'post').maybeSingle()

  if (!post) notFound()

  const postRow = post as { id: string; character_id: string; post_type: 'post' | 'story'; content: string; posted_at: string; bongstagram_post_media: Media[] }
  const [{ data: profile }, { data: character }] = await Promise.all([
    supabase.from('bongstagram_profiles').select('character_id, profile_name, avatar_url').eq('character_id', postRow.character_id).maybeSingle(),
    supabase.from('characters').select('id, streamer_id, name, avatar_url').eq('id', postRow.character_id).maybeSingle(),
  ])

  if (!profile || !character) notFound()

  const profileRow = profile as Profile
  const characterRow = character as Character
  const [{ data: streamer }, counts] = await Promise.all([
    characterRow.streamer_id
      ? supabase.from('streamers').select('display_name, profile_image_url').eq('id', characterRow.streamer_id).maybeSingle()
      : Promise.resolve({ data: null }),
    getPostCounts(postRow.id),
  ])

  return {
    post: {
      id: postRow.id,
      character_id: postRow.character_id,
      post_type: postRow.post_type,
      content: postRow.content,
      posted_at: postRow.posted_at,
      media: [...(postRow.bongstagram_post_media ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    } satisfies Post,
    profile: profileRow,
    character: characterRow,
    streamer: streamer as Streamer,
    ...counts,
  }
}

async function getPostCounts(postId: string) {
  const adminSupabase = createAdminClient()
  const ipHash = await getBongstagramIpHash()
  const [likesResult, commentsResult, viewerLikesResult] = await Promise.all([
    adminSupabase.from('bongstagram_post_likes').select('post_id').eq('post_id', postId),
    adminSupabase.from('bongstagram_post_comments').select('post_id').eq('post_id', postId),
    ipHash
      ? adminSupabase.from('bongstagram_post_likes').select('post_id').eq('post_id', postId).eq('ip_hash', ipHash)
      : Promise.resolve({ data: [], error: null }),
  ])

  return {
    likeCount: likesResult.error ? 0 : (likesResult.data ?? []).length,
    commentCount: commentsResult.error ? 0 : (commentsResult.data ?? []).length,
    likedByViewer: !viewerLikesResult.error && (viewerLikesResult.data ?? []).length > 0,
  }
}

function formatPostTime(value: string) {
  const elapsed = Date.now() - new Date(value).getTime()
  const day = 24 * 60 * 60 * 1000
  if (elapsed < day) {
    const hours = Math.floor(Math.max(0, elapsed) / (60 * 60 * 1000))
    return hours === 0 ? '방금 전' : `${hours}시간 전`
  }
  const parts = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' }).formatToParts(new Date(value))
  return `${parts.find((part) => part.type === 'month')?.value}월 ${parts.find((part) => part.type === 'day')?.value}일`
}

function PostCaption({ post, profileName, streamerName }: { post: Post; profileName: string; streamerName: string | null }) {
  const parts = post.content.split(/(#[^\s#]+)/g)
  return (
    <p className="whitespace-pre-wrap break-words text-sm text-zinc-300">
      <Link href={`/bongstagram/${post.character_id}`} className="font-bold text-zinc-200 transition-colors hover:text-fuchsia-300"><BongstagramDisplayName profileName={profileName} streamerName={streamerName} /></Link>{' '}
      {parts.map((part, index) => part.startsWith('#') ? <span key={`${part}-${index}`} className="text-sky-400">{part}</span> : <span key={`${part}-${index}`}>{part}</span>)}
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
              <BongstagramPostInteractions postId={data.post.id} initialLikeCount={data.likeCount} initialCommentCount={data.commentCount} initialLiked={data.likedByViewer} caption={data.post.content ? <PostCaption post={data.post} profileName={data.profile.profile_name} streamerName={data.streamer?.display_name ?? null} /> : null} />
              <p className="text-[11px] text-zinc-500">{formatPostTime(data.post.posted_at)}</p>
            </div>
          </article>
        </div>
      </div>
      <BongstagramBottomNav />
    </div>
  )
}
