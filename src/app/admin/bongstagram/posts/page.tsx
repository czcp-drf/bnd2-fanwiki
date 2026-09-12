import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import BongstagramPostManager from '../BongstagramPostManager'

export const metadata: Metadata = { title: 'Bongstagram 게시물 관리' }

type CharacterRow = {
  id: string
  name: string
  avatar_url: string | null
  streamers: { display_name: string } | null
}

type ProfileRow = {
  character_id: string
  profile_name: string
  avatar_url: string | null
}

type MediaRow = {
  id: string
  media_type: 'image' | 'video'
  media_url: string
  storage_path: string | null
  sort_order: number
}

type PostRow = {
  id: string
  character_id: string
  post_type: 'post' | 'story'
  content: string
  posted_at: string
  story_expires_at: string | null
  bongstagram_post_media: MediaRow[]
}

async function getPostData() {
  const supabase = createAdminClient()
  const [{ data: characters }, { data: profiles }, { data: posts }] = await Promise.all([
    supabase
      .from('characters')
      .select('id, name, avatar_url, streamers ( display_name )')
      .order('name'),
    supabase
      .from('bongstagram_profiles')
      .select('character_id, profile_name, avatar_url'),
    supabase
      .from('bongstagram_posts')
      .select('id, character_id, post_type, content, posted_at, story_expires_at, bongstagram_post_media ( id, media_type, media_url, storage_path, sort_order )')
      .order('posted_at', { ascending: false }),
  ])

  return {
    characters: (characters ?? []) as unknown as CharacterRow[],
    profiles: (profiles ?? []) as unknown as ProfileRow[],
    posts: ((posts ?? []) as unknown as PostRow[]).map((post) => ({
      id: post.id,
      character_id: post.character_id,
      post_type: post.post_type,
      content: post.content,
      posted_at: post.posted_at,
      story_expires_at: post.story_expires_at,
      media: post.bongstagram_post_media.sort((a, b) => a.sort_order - b.sort_order),
    })),
  }
}

export default async function AdminBongstagramPostsPage() {
  const { characters, profiles, posts } = await getPostData()

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-xl font-black text-white">Bongstagram 게시물 관리</h1>
        <p className="mt-1 text-sm text-zinc-500">프로필별 게시글과 스토리를 등록하고 관리합니다.</p>
      </div>
      <BongstagramPostManager characters={characters} profiles={profiles} posts={posts} />
    </div>
  )
}
