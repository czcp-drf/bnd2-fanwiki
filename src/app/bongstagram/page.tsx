import type { Metadata } from 'next'
import Link from 'next/link'
import AppImage from '@/components/ui/AppImage'
import BongstagramVideoPlayer from './BongstagramVideoPlayer'
import BongstagramDisplayName from './BongstagramDisplayName'
import BongstagramProfileAvatar from './BongstagramProfileAvatar'
import BongstagramStoryRail from './BongstagramStoryRail'
import MediaCarousel from './MediaCarousel'
import BongstagramPostInteractions from './BongstagramPostInteractions'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBongstagramIpHash } from '@/lib/bongstagram/like-ip'
import { isStoryVisible } from '@/lib/bongstagram/story-schedule'
import {
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Search,
  Send,
  SquarePlus,
  UserRound,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Bongstagram',
  description: '봉누도2 인게임 SNS Bongstagram',
}

type FeedMedia = {
  id: string
  media_type: 'image' | 'video'
  media_url: string
  sort_order: number
}

type FeedPost = {
  id: string
  character_id: string
  post_type: 'post' | 'story'
  content: string
  posted_at: string
  story_expires_at: string | null
  media: FeedMedia[]
  comment_count?: number
  like_count?: number
  profile_name: string
  profile_avatar_url: string | null
  character_name: string
  character_avatar_url: string | null
  streamer_name: string | null
  streamer_avatar_url: string | null
  liked_by_viewer?: boolean
}

async function getFeedContent(): Promise<{ posts: FeedPost[]; stories: FeedPost[] }> {
  const supabase = await createClient()
  const [{ data: posts, error: postsError }, { data: profiles }, { data: characters }, { data: streamers }] = await Promise.all([
    supabase
      .from('bongstagram_posts')
      .select('id, character_id, post_type, content, posted_at, story_expires_at, bongstagram_post_media ( id, media_type, media_url, sort_order )')
      .order('posted_at', { ascending: false }),
    supabase
      .from('bongstagram_profiles')
      .select('character_id, profile_name, avatar_url'),
    supabase
      .from('characters')
      .select('id, streamer_id, name, avatar_url'),
    supabase
      .from('streamers')
      .select('id, display_name, profile_image_url'),
  ])

  if (postsError && postsError.code !== 'PGRST205') {
    console.error('Bongstagram feed lookup failed:', postsError.code, postsError.message)
  }

  type PostRow = { id: string; character_id: string; post_type: 'post' | 'story'; content: string; posted_at: string; story_expires_at: string | null; bongstagram_post_media: FeedMedia[] }
  type ProfileRow = { character_id: string; profile_name: string; avatar_url: string | null }
  type CharacterRow = { id: string; streamer_id: string | null; name: string; avatar_url: string | null }
  type StreamerRow = { id: string; display_name: string; profile_image_url: string | null }
  const profilesByCharacterId = new Map(((profiles ?? []) as ProfileRow[]).map((profile) => [profile.character_id, profile]))
  const charactersById = new Map(((characters ?? []) as CharacterRow[]).map((character) => [character.id, character]))
  const streamersById = new Map(((streamers ?? []) as StreamerRow[]).map((streamer) => [streamer.id, streamer]))

  const feedPosts = ((posts ?? []) as PostRow[]).flatMap((post) => {
    const profile = profilesByCharacterId.get(post.character_id)
    const character = charactersById.get(post.character_id)
    if (!profile || !character) return []
    return [{
      id: post.id,
      character_id: post.character_id,
      post_type: post.post_type,
      content: post.content,
      posted_at: post.posted_at,
      story_expires_at: post.story_expires_at,
      media: post.bongstagram_post_media.sort((a, b) => a.sort_order - b.sort_order),
      profile_name: profile.profile_name,
      profile_avatar_url: profile.avatar_url,
      character_name: character.name,
      character_avatar_url: character.avatar_url,
      streamer_name: character.streamer_id ? streamersById.get(character.streamer_id)?.display_name ?? null : null,
      streamer_avatar_url: character.streamer_id ? streamersById.get(character.streamer_id)?.profile_image_url ?? null : null,
    }]
  })

  const postIds = feedPosts.filter((post) => post.post_type === 'post').map((post) => post.id)
  let likesByPostId = new Map<string, number>()
  let commentsByPostId = new Map<string, number>()
  let likedPostIds = new Set<string>()

  if (postIds.length > 0) {
    const adminSupabase = createAdminClient()
    const ipHash = await getBongstagramIpHash()
    const [likesResult, commentsResult, viewerLikesResult] = await Promise.all([
      adminSupabase.from('bongstagram_post_likes').select('post_id').in('post_id', postIds),
      adminSupabase.from('bongstagram_post_comments').select('post_id').in('post_id', postIds),
      ipHash
        ? adminSupabase.from('bongstagram_post_likes').select('post_id').in('post_id', postIds).eq('ip_hash', ipHash)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (likesResult.error && likesResult.error.code !== 'PGRST205') {
      console.error('Bongstagram like count lookup failed:', likesResult.error.code, likesResult.error.message)
    }
    if (commentsResult.error && commentsResult.error.code !== 'PGRST205') {
      console.error('Bongstagram comment count lookup failed:', commentsResult.error.code, commentsResult.error.message)
    }

    likesByPostId = new Map<string, number>()
    for (const row of (likesResult.data ?? []) as { post_id: string }[]) {
      likesByPostId.set(row.post_id, (likesByPostId.get(row.post_id) ?? 0) + 1)
    }
    commentsByPostId = new Map<string, number>()
    for (const row of (commentsResult.data ?? []) as { post_id: string }[]) {
      commentsByPostId.set(row.post_id, (commentsByPostId.get(row.post_id) ?? 0) + 1)
    }
    likedPostIds = new Set(((viewerLikesResult.data ?? []) as { post_id: string }[]).map((row) => row.post_id))
  }

  const visiblePosts = feedPosts
    .filter((post) => post.post_type === 'post')
    .map((post) => ({
      ...post,
      like_count: likesByPostId.get(post.id) ?? 0,
      comment_count: commentsByPostId.get(post.id) ?? 0,
      liked_by_viewer: likedPostIds.has(post.id),
    }))
  const stories = feedPosts.filter((post) => post.post_type === 'story' && isStoryVisible(post.story_expires_at))
  return { posts: visiblePosts, stories }
}

function FilledHomeIcon({ size = 23 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.3 10.3 12 2.5l9.7 7.8v10.2h-6.2v-6.4H8.5v6.4H2.3V10.3Z" />
    </svg>
  )
}

function FeedMedia({ media, label }: { media: FeedMedia; label: string }) {
  return media.media_type === 'video'
    ? <BongstagramVideoPlayer src={media.media_url} label={label} />
    : <div className="relative w-full overflow-hidden bg-black" style={{ height: 'min(125vw, 675px)' }}>
      <AppImage src={media.media_url} alt={`${label} 게시물`} width={540} height={675} className="h-full w-full object-contain" style={{ objectFit: 'contain', objectPosition: 'center' }} />
    </div>
}

function formatPostTime(value: string) {
  const date = new Date(value)
  const elapsed = Date.now() - date.getTime()
  const dayMs = 24 * 60 * 60 * 1000

  if (elapsed < dayMs) {
    const hours = Math.floor(Math.max(0, elapsed) / (60 * 60 * 1000))
    return hours === 0 ? '방금 전' : `${hours}시간 전`
  }

  const dateParts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date)
  const month = dateParts.find((part) => part.type === 'month')?.value
  const dayOfMonth = dateParts.find((part) => part.type === 'day')?.value
  return `${month}월 ${dayOfMonth}일`
}

function PostCaption({ post }: { post: FeedPost }) {
  const parts = post.content.split(/(#[^\s#]+)/g)
  return (
    <p className="whitespace-pre-wrap break-words text-sm text-zinc-300">
      <Link href={`/bongstagram/${post.character_id}`} className="font-bold text-zinc-200 transition-colors hover:text-fuchsia-300"><BongstagramDisplayName profileName={post.profile_name} streamerName={post.streamer_name} /></Link>{' '}
      {parts.map((part, index) => part.startsWith('#')
        ? <span key={`${part}-${index}`} className="text-sky-400">{part}</span>
        : <span key={`${part}-${index}`}>{part}</span>)}
    </p>
  )
}

function FeedPostCard({ post }: { post: FeedPost }) {
  return (
    <article className="border-b border-zinc-800">
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`/bongstagram/${post.character_id}`} aria-label={`${post.profile_name} 프로필 보기`} className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-bold text-zinc-200">
            <BongstagramProfileAvatar
              profileAvatarUrl={post.profile_avatar_url}
              streamerAvatarUrl={post.streamer_avatar_url}
              fallbackAvatarUrl={post.character_avatar_url}
              profileName={post.profile_name}
              streamerName={post.streamer_name}
              className="h-full w-full object-cover"
            />
          </Link>
          <div className="min-w-0">
            <Link href={`/bongstagram/${post.character_id}`} className="truncate text-sm font-semibold text-zinc-200 transition-colors hover:text-fuchsia-300"><BongstagramDisplayName profileName={post.profile_name} streamerName={post.streamer_name} /></Link>
          </div>
        </div>
        <button type="button" className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-bold !text-white transition-colors hover:bg-sky-400">
          팔로우
        </button>
      </header>

      {post.media.length > 0 ? (
        <MediaCarousel>
          {post.media.map((media) => (
            <div key={media.id} className="w-full min-w-0 max-w-full flex-none snap-center">
              <FeedMedia media={media} label={post.profile_name} />
            </div>
          ))}
        </MediaCarousel>
      ) : (
        <div className="flex min-h-56 items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-fuchsia-950/20 px-6 py-12 text-center text-sm text-zinc-500">
          이미지가 없는 게시물입니다.
        </div>
      )}

      <div className="space-y-3 px-4 py-3">
        <BongstagramPostInteractions
          postId={post.id}
          initialLikeCount={post.like_count}
          initialCommentCount={post.comment_count}
          initialLiked={post.liked_by_viewer}
        />
        {post.content && <PostCaption post={post} />}
        {!!post.comment_count && <p className="text-sm text-zinc-400">댓글 {post.comment_count}개 모두 보기</p>}
        <p className="text-[11px] text-zinc-500">{formatPostTime(post.posted_at)}</p>
      </div>
    </article>
  )
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-[540px] items-center justify-around border-x border-t border-zinc-800 bg-zinc-950/95 px-3 py-3 backdrop-blur" aria-label="Bongstagram 메뉴">
      <Link href="/bongstagram" aria-label="홈" className="text-white">
        <FilledHomeIcon />
      </Link>
      <button type="button" aria-label="검색" className="text-zinc-500 transition-colors hover:text-zinc-200">
        <Search size={23} />
      </button>
      <button type="button" aria-label="게시물 작성" className="text-zinc-500 transition-colors hover:text-zinc-200">
        <SquarePlus size={24} strokeWidth={1.8} />
      </button>
      <button type="button" aria-label="프로필" className="text-zinc-500 transition-colors hover:text-zinc-200">
        <UserRound size={22} strokeWidth={2.2} />
      </button>
    </nav>
  )
}

export default async function BongstagramPage() {
  const { posts, stories } = await getFeedContent()

  return (
    <div className="bongstagram-theme">
      <div className="bongstagram-font min-h-[calc(100vh-3.5rem)] bg-zinc-950">
        <div className="mx-auto min-h-[calc(100vh-3.5rem)] w-full max-w-[540px] border-x border-zinc-900 bg-zinc-950 pb-20">
          <header className="flex h-16 items-center justify-between border-b border-zinc-800 px-5">
          <Link href="/bongstagram" className="inline-block origin-left scale-x-105 text-2xl font-medium leading-none tracking-tight text-white">
            Bongstagram
          </Link>
          <div className="flex items-center gap-4 text-zinc-300">
            <button type="button" aria-label="좋아요 알림" className="transition-colors hover:text-white">
              <Heart size={25} />
            </button>
            <button type="button" aria-label="메시지" className="transition-colors hover:text-white">
              <Send size={25} />
            </button>
          </div>
          </header>

        <BongstagramStoryRail stories={stories} />

        <main>
          {posts.length > 0 ? posts.map((post) => <FeedPostCard key={post.id} post={post} />) : (
          <article className="border-b border-zinc-800">
            <header className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-fuchsia-500 to-amber-300 p-[2px]">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-200">차</div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">차수진</p>
                </div>
              </div>
              <div>
                <button type="button" className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-bold !text-white transition-colors hover:bg-sky-400">
                  팔로우
                </button>
              </div>
            </header>

            <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-fuchsia-950/20">
              <div className="flex max-w-[16rem] flex-col items-center gap-4 px-6 text-center">
                <div className="rounded-full border border-zinc-800 bg-zinc-900 p-4 text-fuchsia-300">
                  <ImageIcon size={30} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">게시물을 준비하고 있습니다.</p>
                  <p className="mt-1.5 text-xs leading-5 text-zinc-500">캐릭터별 Bongstagram 프로필과 게시물 데이터가 연결되면 이 영역에 사진이 표시됩니다.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-zinc-300">
                  <Heart size={23} />
                  <MessageCircle size={23} />
                  <Send size={22} />
                </div>
              </div>
              <p className="text-sm font-semibold text-zinc-200">피드 준비 중</p>
              <p className="text-sm text-zinc-300">봉누도2의 소식과 일상을 Bongstagram에서 만나보세요.</p>
            </div>
          </article>
          )}
        </main>

        <BottomNav />
        </div>
      </div>
    </div>
  )
}
