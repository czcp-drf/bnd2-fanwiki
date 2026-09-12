import type { Metadata } from 'next'
import Link from 'next/link'
import AppImage from '@/components/ui/AppImage'
import { createClient } from '@/lib/supabase/server'
import { isStoryVisible } from '@/lib/bongstagram/story-schedule'
import {
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Plus,
  Search,
  Send,
  SquarePlus,
  UserRound,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Bongstagram',
  description: '봉누도2 인게임 SNS Bongstagram',
}

const storyPreviews = [
  { label: '명충쇠', mark: '명', tone: 'from-amber-300 via-pink-500 to-fuchsia-600' },
  { label: 'zzya', mark: 'Z', tone: 'from-orange-300 via-fuchsia-500 to-violet-600' },
  { label: '김형순', mark: '김', tone: 'from-fuchsia-400 via-violet-500 to-sky-500' },
  { label: '차수진', mark: '차', tone: 'from-pink-400 via-red-400 to-orange-300' },
]

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
  profile_name: string
  profile_avatar_url: string | null
  character_name: string
  character_avatar_url: string | null
}

async function getFeedContent(): Promise<{ posts: FeedPost[]; stories: FeedPost[] }> {
  const supabase = await createClient()
  const [{ data: posts, error: postsError }, { data: profiles }, { data: characters }] = await Promise.all([
    supabase
      .from('bongstagram_posts')
      .select('id, character_id, post_type, content, posted_at, story_expires_at, bongstagram_post_media ( id, media_type, media_url, sort_order )')
      .order('posted_at', { ascending: false }),
    supabase
      .from('bongstagram_profiles')
      .select('character_id, profile_name, avatar_url'),
    supabase
      .from('characters')
      .select('id, name, avatar_url'),
  ])

  if (postsError && postsError.code !== 'PGRST205') {
    console.error('Bongstagram feed lookup failed:', postsError.code, postsError.message)
  }

  type PostRow = { id: string; character_id: string; post_type: 'post' | 'story'; content: string; posted_at: string; story_expires_at: string | null; bongstagram_post_media: FeedMedia[] }
  type ProfileRow = { character_id: string; profile_name: string; avatar_url: string | null }
  type CharacterRow = { id: string; name: string; avatar_url: string | null }
  const profilesByCharacterId = new Map(((profiles ?? []) as ProfileRow[]).map((profile) => [profile.character_id, profile]))
  const charactersById = new Map(((characters ?? []) as CharacterRow[]).map((character) => [character.id, character]))

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
    }]
  })

  const stories = feedPosts.filter((post) => post.post_type === 'story' && isStoryVisible(post.story_expires_at))
  return { posts: feedPosts.filter((post) => post.post_type === 'post'), stories }
}

function StoryBubble({
  label,
  mark,
  tone,
  avatarUrl,
  href,
  mine = false,
}: {
  label: string
  mark: string
  tone?: string
  avatarUrl?: string | null
  href?: string
  mine?: boolean
}) {
  const bubble = (
    <div className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5">
      <div className={`relative rounded-full ${mine ? '' : 'bg-gradient-to-tr p-[2px] from-zinc-800 to-zinc-700'}`}>
        {tone && <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${tone}`} />}
        <div className={`bongstagram-story-avatar relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full text-xl font-bold text-zinc-200 ${mine ? '' : 'border-2 border-zinc-950'}`}>
          {avatarUrl ? <AppImage src={avatarUrl} alt={label} className="h-full w-full rounded-full object-cover" /> : mark}
        </div>
        {mine && (
          <span className="bongstagram-story-add absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full">
            <Plus size={12} strokeWidth={3} />
          </span>
        )}
      </div>
      <span className="max-w-[4.5rem] truncate text-[11px] text-zinc-400">{label}</span>
    </div>
  )
  return href ? <Link href={href}>{bubble}</Link> : bubble
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
    ? <video controls preload="metadata" src={media.media_url} className="aspect-[4/5] w-full bg-zinc-950 object-cover" aria-label={`${label} 동영상`} />
    : <AppImage src={media.media_url} alt={`${label} 게시물`} width={540} height={675} className="aspect-[4/5] w-full object-cover" />
}

function PostCaption({ post }: { post: FeedPost }) {
  const parts = post.content.split(/(#[^\s#]+)/g)
  return (
    <p className="whitespace-pre-wrap break-words text-sm text-zinc-300">
      <Link href={`/bongstagram/${post.character_id}`} className="font-bold text-zinc-200 transition-colors hover:text-fuchsia-300">{post.profile_name}</Link>{' '}
      {parts.map((part, index) => part.startsWith('#')
        ? <span key={`${part}-${index}`} className="text-sky-400">{part}</span>
        : <span key={`${part}-${index}`}>{part}</span>)}
    </p>
  )
}

function FeedPostCard({ post }: { post: FeedPost }) {
  const avatarUrl = post.profile_avatar_url ?? post.character_avatar_url
  return (
    <article className="border-b border-zinc-800">
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-bold text-zinc-200">
            {avatarUrl ? <AppImage src={avatarUrl} alt={post.profile_name} className="h-full w-full object-cover" /> : post.profile_name.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <Link href={`/bongstagram/${post.character_id}`} className="truncate text-sm font-semibold text-zinc-200 transition-colors hover:text-fuchsia-300">{post.profile_name}</Link>
          </div>
        </div>
        <button type="button" className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-bold !text-white transition-colors hover:bg-sky-400">
          팔로우
        </button>
      </header>

      {post.media.length > 0 ? (
        <div className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {post.media.map((media) => (
            <div key={media.id} className="min-w-full snap-center">
              <FeedMedia media={media} label={post.profile_name} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-56 items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-fuchsia-950/20 px-6 py-12 text-center text-sm text-zinc-500">
          이미지가 없는 게시물입니다.
        </div>
      )}

      <div className="space-y-3 px-4 py-3">
        <div className="flex items-center gap-4 text-zinc-300">
          <Heart size={23} />
          <MessageCircle size={23} />
          <Send size={22} />
        </div>
        {post.media.length > 1 && <p className="text-[11px] text-zinc-600">{post.media.length}개의 미디어 · 좌우로 넘겨보기</p>}
        {post.content && <PostCaption post={post} />}
      </div>
    </article>
  )
}

function BottomNav() {
  return (
    <nav className="flex items-center justify-around border-t border-zinc-800 bg-zinc-950/95 px-3 py-3 backdrop-blur" aria-label="Bongstagram 메뉴">
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
        <div className="mx-auto min-h-[calc(100vh-3.5rem)] w-full max-w-[540px] border-x border-zinc-900 bg-zinc-950">
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

        <section className="flex gap-3 overflow-x-auto border-b border-zinc-800 px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="스토리">
          <StoryBubble label="내 스토리" mark="D" mine />
          {stories.length > 0
            ? stories.map((story) => (
              <StoryBubble key={story.id} label={story.profile_name} mark={story.profile_name.slice(0, 1)} avatarUrl={story.profile_avatar_url ?? story.character_avatar_url} href={`/bongstagram/${story.character_id}`} tone="from-amber-300 via-pink-500 to-fuchsia-600" />
            ))
            : storyPreviews.map((story) => <StoryBubble key={story.label} {...story} />)}
        </section>

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
