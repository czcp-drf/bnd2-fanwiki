'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Archive, Grid3X3, Image as ImageIcon } from 'lucide-react'
import AppImage from '@/components/ui/AppImage'
import BongstagramDisplayName from './BongstagramDisplayName'
import BongstagramBackButton from './BongstagramBackButton'
import BongstagramFollowButton from './BongstagramFollowButton'
import BongstagramProfileAvatar from './BongstagramProfileAvatar'
import { StoryViewer, type BongstagramStory, type StorySlide } from './BongstagramStoryRail'

type Profile = { character_id: string; profile_name: string; avatar_url: string | null; bio: string | null }
type Character = { id: string; name: string; avatar_url: string | null }
type Streamer = { display_name: string; profile_image_url: string | null } | null
type Media = { id: string; media_type: 'image' | 'video'; media_url: string; sort_order: number }
type ProfilePost = { id: string; post_type: 'post' | 'story'; content: string; posted_at: string; story_expires_at: string | null; media: Media[]; liked_by_viewer?: boolean; is_active_story: boolean }

function MediaThumb({ media, label }: { media: Media; label: string }) {
  return media.media_type === 'video'
    ? <video muted playsInline preload="metadata" src={media.media_url} className="aspect-square w-full object-cover" aria-label={`${label} 동영상`} />
    : <AppImage src={media.media_url} alt={label} width={180} height={180} className="aspect-square w-full object-cover" />
}

function formatArchiveDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' }).format(new Date(value))
}

function createStorySlides(stories: ProfilePost[], profile: Profile, character: Character, streamer: Streamer) {
  const slides: StorySlide[] = []

  stories.forEach((post) => {
    const story: BongstagramStory = {
      id: post.id,
      character_id: character.id,
      content: post.content,
      posted_at: post.posted_at,
      media: post.media,
      profile_name: profile.profile_name,
      profile_avatar_url: profile.avatar_url,
      character_avatar_url: character.avatar_url,
      streamer_name: streamer?.display_name ?? null,
      streamer_avatar_url: streamer?.profile_image_url ?? null,
      liked_by_viewer: post.liked_by_viewer,
    }

    if (post.media.length > 0) {
      post.media.forEach((media) => slides.push({ story, media }))
    } else {
      slides.push({ story, media: null })
    }
  })

  return slides
}

export default function BongstagramProfileScreen({ profile, character, streamer, posts }: { profile: Profile; character: Character; streamer: Streamer; posts: ProfilePost[] }) {
  const [tab, setTab] = useState<'posts' | 'archive'>('posts')
  const [activeStory, setActiveStory] = useState<{ source: 'active' | 'archive'; groupIndex: number; slideIndex: number } | null>(null)
  const regularPosts = posts.filter((post) => post.post_type === 'post')
  const activeStoryPosts = useMemo(() => posts.filter((post) => post.post_type === 'story' && post.is_active_story), [posts])
  const storyGroups = useMemo(() => {
    const groups = new Map<string, ProfilePost[]>()
    posts.filter((post) => post.post_type === 'story').forEach((story) => {
      const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(story.posted_at))
      groups.set(key, [...(groups.get(key) ?? []), story])
    })
    return Array.from(groups.values())
  }, [posts])
  const storySlideGroups = useMemo<StorySlide[][]>(() => storyGroups.map((group) => {
    return createStorySlides(group, profile, character, streamer)
  }), [character, profile, storyGroups, streamer])
  const activeStorySlideGroups = useMemo<StorySlide[][]>(() => {
    const slides = createStorySlides(activeStoryPosts, profile, character, streamer)
    return slides.length > 0 ? [slides] : []
  }, [activeStoryPosts, character, profile, streamer])
  const viewerSlideGroups = activeStory?.source === 'active' ? activeStorySlideGroups : storySlideGroups
  const hasActiveStory = activeStorySlideGroups.length > 0

  return (
    <>
      <header className="relative flex h-16 items-center border-b border-zinc-800 px-5">
        <BongstagramBackButton label="이전 페이지로 돌아가기" />
        <h1 className="absolute left-1/2 max-w-[60%] -translate-x-1/2 truncate text-lg font-semibold text-white"><BongstagramDisplayName profileName={profile.profile_name} streamerName={streamer?.display_name} /></h1>
      </header>

      <main>
        <section className="px-5 pb-5 pt-6">
          <div className="flex items-center gap-5">
            <button type="button" disabled={!hasActiveStory} onClick={() => hasActiveStory && setActiveStory({ source: 'active', groupIndex: 0, slideIndex: 0 })} aria-label={hasActiveStory ? '현재 스토리 보기' : '프로필 이미지'} className={`rounded-full p-[3px] ${hasActiveStory ? 'cursor-pointer bg-gradient-to-tr from-amber-300 via-fuchsia-500 to-sky-400' : ''}`}>
              <div className="bongstagram-story-avatar flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-xl font-bold text-zinc-300">
                <BongstagramProfileAvatar profileAvatarUrl={profile.avatar_url} streamerAvatarUrl={streamer?.profile_image_url} fallbackAvatarUrl={character.avatar_url} profileName={profile.profile_name} streamerName={streamer?.display_name} className="h-full w-full object-cover" />
              </div>
            </button>
            <div className="grid min-w-0 flex-1 grid-cols-3 text-center">
              <div><strong className="block text-base text-white">{regularPosts.length}</strong><span className="mt-1 block text-xs text-zinc-500">게시물</span></div>
              <div><strong className="block text-base text-white">0</strong><span className="mt-1 block text-xs text-zinc-500">팔로워</span></div>
              <div><strong className="block text-base text-white">0</strong><span className="mt-1 block text-xs text-zinc-500">팔로우</span></div>
            </div>
          </div>

          <div className="mt-4"><h2 className="text-base font-bold text-white"><BongstagramDisplayName profileName={profile.profile_name} streamerName={streamer?.display_name} /></h2><p className="mt-1 text-sm text-zinc-400">{character.name}</p>{profile.bio && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-5 text-zinc-300">{profile.bio}</p>}</div>
          <div className="mt-4 flex"><BongstagramFollowButton characterId={character.id} className="w-full py-2.5 text-base" /></div>
        </section>

        <nav className="flex border-b border-zinc-800" aria-label="프로필 콘텐츠 탭">
          <button type="button" onClick={() => setTab('posts')} aria-label="게시물 보기" aria-pressed={tab === 'posts'} className={`flex flex-1 cursor-pointer justify-center border-b-2 py-3 transition-colors ${tab === 'posts' ? 'border-white text-white' : 'border-transparent text-zinc-600 hover:text-zinc-300'}`}><Grid3X3 size={21} /></button>
          <button type="button" onClick={() => setTab('archive')} aria-label="스토리 보관함 보기" aria-pressed={tab === 'archive'} className={`flex flex-1 cursor-pointer justify-center border-b-2 py-3 transition-colors ${tab === 'archive' ? 'border-white text-white' : 'border-transparent text-zinc-600 hover:text-zinc-300'}`}><Archive size={21} /></button>
        </nav>

        {tab === 'posts' ? <section>{regularPosts.length === 0 ? <p className="py-16 text-center text-sm text-zinc-600">등록된 게시물이 없습니다.</p> : <div className="grid grid-cols-3 gap-px bg-zinc-950">{regularPosts.map((post) => <Link key={post.id} href={`/bongstagram/post/${post.id}`} aria-label="게시물 상세 보기" className="block aspect-square overflow-hidden bg-black">{post.media[0] ? <MediaThumb media={post.media[0]} label={`${profile.profile_name} 게시물`} /> : <div className="flex h-full items-center justify-center bg-zinc-900 text-zinc-700"><ImageIcon size={20} /></div>}</Link>)}</div>}</section> : <section className="space-y-6 px-5 py-5">{storyGroups.length === 0 ? <p className="py-12 text-center text-sm text-zinc-600">보관된 스토리가 없습니다.</p> : storyGroups.map((group, groupIndex) => <div key={group[0].id}><h3 className="mb-2 text-xs font-medium text-zinc-500">{formatArchiveDate(group[0].posted_at)}</h3><div className="grid grid-cols-4 gap-1">{group.map((story) => { const slideIndex = storySlideGroups[groupIndex]?.findIndex((slide) => slide.story.id === story.id) ?? 0; return story.media[0] ? <button key={story.id} type="button" onClick={() => setActiveStory({ source: 'archive', groupIndex, slideIndex: Math.max(0, slideIndex) })} aria-label={`${formatArchiveDate(story.posted_at)} 스토리 보기`} className="block aspect-square cursor-pointer overflow-hidden bg-black text-left"><MediaThumb media={story.media[0]} label={`${profile.profile_name} 스토리`} /></button> : <button key={story.id} type="button" onClick={() => setActiveStory({ source: 'archive', groupIndex, slideIndex: Math.max(0, slideIndex) })} aria-label={`${formatArchiveDate(story.posted_at)} 스토리 보기`} className="flex aspect-square cursor-pointer items-center justify-center bg-zinc-900 text-zinc-700"><ImageIcon size={18} /></button>})}</div></div>)}</section>}
      </main>
      {activeStory && viewerSlideGroups.length > 0 && <StoryViewer key={`${activeStory.source}-${activeStory.groupIndex}-${activeStory.slideIndex}`} slideGroups={viewerSlideGroups} activeGroupIndex={activeStory.groupIndex} activeSlideIndex={activeStory.slideIndex} onClose={() => setActiveStory(null)} onChange={(groupIndex, slideIndex) => setActiveStory({ source: activeStory.source, groupIndex, slideIndex })} />}
    </>
  )
}
