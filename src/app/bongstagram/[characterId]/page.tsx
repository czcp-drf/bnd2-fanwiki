import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AppImage from '@/components/ui/AppImage'
import BongstagramDisplayName from '../BongstagramDisplayName'
import BongstagramProfileAvatar from '../BongstagramProfileAvatar'
import { ArrowLeft, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatKstDate, getKstDateKey } from '@/lib/bongstagram/story-schedule'

type Media = {
  id: string
  media_type: 'image' | 'video'
  media_url: string
  sort_order: number
}

type ProfilePost = {
  id: string
  post_type: 'post' | 'story'
  content: string
  posted_at: string
  story_expires_at: string | null
  media: Media[]
}

async function getProfileData(characterId: string) {
  const supabase = await createClient()
  const [{ data: profile }, { data: character }, { data: posts }] = await Promise.all([
    supabase
      .from('bongstagram_profiles')
      .select('character_id, profile_name, avatar_url, bio')
      .eq('character_id', characterId)
      .maybeSingle(),
    supabase
      .from('characters')
      .select('id, streamer_id, name, avatar_url')
      .eq('id', characterId)
      .maybeSingle(),
    supabase
      .from('bongstagram_posts')
      .select('id, post_type, content, posted_at, story_expires_at, bongstagram_post_media ( id, media_type, media_url, sort_order )')
      .eq('character_id', characterId)
      .order('posted_at', { ascending: false }),
  ])

  if (!profile || !character) notFound()

  type ProfileRow = { character_id: string; profile_name: string; avatar_url: string | null; bio: string | null }
  type CharacterRow = { id: string; streamer_id: string | null; name: string; avatar_url: string | null }
  type PostRow = Omit<ProfilePost, 'media'> & { bongstagram_post_media: Media[] }
  const profileRow = profile as ProfileRow
  const characterRow = character as CharacterRow
  const { data: streamer } = characterRow.streamer_id
    ? await supabase.from('streamers').select('display_name, profile_image_url').eq('id', characterRow.streamer_id).maybeSingle()
    : { data: null }
  const profilePosts = ((posts ?? []) as PostRow[]).map((post) => ({
    id: post.id,
    post_type: post.post_type,
    content: post.content,
    posted_at: post.posted_at,
    story_expires_at: post.story_expires_at,
    media: post.bongstagram_post_media.sort((a, b) => a.sort_order - b.sort_order),
  }))

  return {
    profile: profileRow,
    character: characterRow,
    streamer: streamer as { display_name: string; profile_image_url: string | null } | null,
    posts: profilePosts,
  }
}

function MediaThumb({ media, label }: { media: Media; label: string }) {
  return media.media_type === 'video'
    ? <video muted playsInline preload="metadata" src={media.media_url} className="aspect-square w-full object-cover" aria-label={`${label} 동영상`} />
    : <AppImage src={media.media_url} alt={label} width={180} height={180} className="aspect-square w-full object-cover" />
}

export async function generateMetadata({ params }: { params: Promise<{ characterId: string }> }): Promise<Metadata> {
  const { characterId } = await params
  const data = await getProfileData(characterId)
  return { title: `${data.profile.profile_name} · Bongstagram` }
}

export default async function BongstagramProfilePage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = await params
  const { profile, character, streamer, posts } = await getProfileData(characterId)
  const regularPosts = posts.filter((post) => post.post_type === 'post')
  const storyGroups = new Map<string, ProfilePost[]>()
  for (const story of posts.filter((post) => post.post_type === 'story')) {
    const key = getKstDateKey(story.posted_at)
    const group = storyGroups.get(key) ?? []
    group.push(story)
    storyGroups.set(key, group)
  }

  return (
    <div className="bongstagram-theme">
      <div className="bongstagram-font min-h-[calc(100vh-3.5rem)] bg-zinc-950">
        <div className="mx-auto min-h-[calc(100vh-3.5rem)] w-full max-w-[540px] border-x border-zinc-900 bg-zinc-950">
          <header className="flex h-16 items-center gap-4 border-b border-zinc-800 px-5">
            <Link href="/bongstagram" aria-label="Bongstagram 홈" className="text-zinc-300 transition-colors hover:text-white"><ArrowLeft size={21} /></Link>
            <h1 className="truncate text-lg font-medium text-white"><BongstagramDisplayName profileName={profile.profile_name} streamerName={streamer?.display_name} /></h1>
          </header>

          <section className="flex items-center gap-5 border-b border-zinc-800 px-5 py-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-2xl font-bold text-zinc-200">
              <BongstagramProfileAvatar
                profileAvatarUrl={profile.avatar_url}
                streamerAvatarUrl={streamer?.profile_image_url}
                fallbackAvatarUrl={character.avatar_url}
                profileName={profile.profile_name}
                streamerName={streamer?.display_name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-white"><BongstagramDisplayName profileName={profile.profile_name} streamerName={streamer?.display_name} /></h2>
              <p className="mt-1 text-sm text-zinc-500">{character.name}</p>
              {profile.bio && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-zinc-300">{profile.bio}</p>}
            </div>
          </section>

          <main>
            <section className="border-b border-zinc-800 px-4 py-5">
              <h2 className="mb-3 text-sm font-semibold text-zinc-200">게시물</h2>
              {regularPosts.length === 0 ? <p className="py-8 text-center text-sm text-zinc-600">등록된 게시물이 없습니다.</p> : <div className="grid grid-cols-3 gap-1">{regularPosts.map((post) => post.media[0] ? <MediaThumb key={post.id} media={post.media[0]} label={`${profile.profile_name} 게시물`} /> : <div key={post.id} className="flex aspect-square items-center justify-center bg-zinc-900 text-zinc-700"><ImageIcon size={20} /></div>)}</div>}
            </section>

            <section className="px-4 py-5">
              <h2 className="mb-3 text-sm font-semibold text-zinc-200">스토리 보관함</h2>
              {storyGroups.size === 0 ? <p className="py-8 text-center text-sm text-zinc-600">보관된 스토리가 없습니다.</p> : <div className="space-y-6">{Array.from(storyGroups.entries()).map(([dateKey, group]) => <div key={dateKey}><h3 className="mb-2 text-xs font-medium text-zinc-500">{formatKstDate(group[0].posted_at)}</h3><div className="grid grid-cols-4 gap-1">{group.map((story) => story.media[0] ? <MediaThumb key={story.id} media={story.media[0]} label={`${profile.profile_name} 스토리`} /> : <div key={story.id} className="flex aspect-square items-center justify-center bg-zinc-900 text-zinc-700"><ImageIcon size={18} /></div>)}</div></div>)}</div>}
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
