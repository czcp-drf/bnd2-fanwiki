export type BongstagramFeedMedia = {
  id: string
  media_type: 'image' | 'video'
  media_url: string
  sort_order: number
}

export type BongstagramFeedPost = {
  id: string
  character_id: string
  post_type: 'post' | 'story'
  content: string
  posted_at: string
  story_expires_at: string | null
  media: BongstagramFeedMedia[]
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

export type BongstagramPostCursor = {
  postedAt: string
  id: string
}
