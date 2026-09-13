import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import BongstagramPostManager from '../BongstagramPostManager'
import BongstagramCommentManager from '../BongstagramCommentManager'

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

type OrganizationRow = {
  id: string
  name: string
}

type MembershipRow = {
  character_id: string
  organization_id: string
  left_at: string | null
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

type PostLikeRow = { post_id: string }
type StoryLikeRow = { story_id: string }

type CommentRow = {
  id: string
  post_id: string
  parent_comment_id: string | null
  author_character_id: string | null
  author_name: string
  content: string
  created_at: string
}

async function getPostData() {
  const supabase = createAdminClient()
  const [{ data: characters }, { data: profiles }, { data: posts }, { data: organizations }, { data: memberships }, { data: comments }, { data: postLikes }, { data: storyLikes }] = await Promise.all([
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
    supabase
      .from('organizations')
      .select('id, name')
      .order('name'),
    supabase
      .from('organization_members')
      .select('character_id, organization_id, left_at')
      .is('left_at', null),
    supabase
      .from('bongstagram_post_comments')
      .select('id, post_id, parent_comment_id, author_character_id, author_name, content, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('bongstagram_post_likes').select('post_id'),
    supabase.from('bongstagram_story_likes').select('story_id'),
  ])

  const likeCountByPostId = new Map<string, number>()
  for (const like of (postLikes ?? []) as PostLikeRow[]) {
    likeCountByPostId.set(like.post_id, (likeCountByPostId.get(like.post_id) ?? 0) + 1)
  }
  const likeCountByStoryId = new Map<string, number>()
  for (const like of (storyLikes ?? []) as StoryLikeRow[]) {
    likeCountByStoryId.set(like.story_id, (likeCountByStoryId.get(like.story_id) ?? 0) + 1)
  }

  return {
    characters: (characters ?? []) as unknown as CharacterRow[],
    profiles: (profiles ?? []) as unknown as ProfileRow[],
    organizations: (organizations ?? []) as unknown as OrganizationRow[],
    memberships: (memberships ?? []) as unknown as MembershipRow[],
    posts: ((posts ?? []) as unknown as PostRow[]).map((post) => ({
      id: post.id,
      character_id: post.character_id,
      post_type: post.post_type,
      content: post.content,
      posted_at: post.posted_at,
      story_expires_at: post.story_expires_at,
      media: post.bongstagram_post_media.sort((a, b) => a.sort_order - b.sort_order),
      like_count: post.post_type === 'story' ? likeCountByStoryId.get(post.id) ?? 0 : likeCountByPostId.get(post.id) ?? 0,
    })),
    comments: (comments ?? []) as unknown as CommentRow[],
  }
}

export default async function AdminBongstagramPostsPage() {
  const { characters, profiles, organizations, memberships, posts, comments } = await getPostData()

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-xl font-black text-white">Bongstagram 게시물 관리</h1>
        <p className="mt-1 text-sm text-zinc-500">프로필별 게시글과 스토리를 등록하고 관리합니다.</p>
      </div>
      <BongstagramCommentManager posts={posts.map(({ id, character_id, post_type, posted_at }) => ({ id, character_id, post_type, posted_at }))} profiles={profiles.map(({ character_id, profile_name }) => ({ character_id, profile_name }))} characters={characters.map(({ id, name }) => ({ id, name }))} comments={comments} />
      <BongstagramPostManager characters={characters} profiles={profiles} organizations={organizations} memberships={memberships} posts={posts} comments={comments} />
    </div>
  )
}
