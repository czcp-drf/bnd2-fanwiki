export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      streamers: {
        Row: {
          id: string
          chzzk_channel_id: string
          display_name: string
          profile_image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['streamers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['streamers']['Insert']>
      }
      characters: {
        Row: {
          id: string
          streamer_id: string
          name: string
          is_name_pending: boolean
          alias: string[] | null
          avatar_url: string | null
          job: string | null
          description: string | null
          status: 'active' | 'dead' | 'retired' | 'hiatus'
          first_appeared: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['characters']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['characters']['Insert']>
      }
      organizations: {
        Row: {
          id: string
          name: string
          category: 'city_hall' | 'public_service' | 'gang' | 'business' | 'illegal' | null
          type:
            | 'police' | 'ems' | 'journalist' | 'traffic' | 'city_hall'
            | 'restaurant_chinese' | 'restaurant_japanese' | 'restaurant_western' | 'restaurant_cafe'
            | 'tuning' | 'farming' | 'fishing'
            | 'information_dealer' | 'gunsmith' | 'money_laundering' | 'smuggling'
            | 'black_market' | 'illegal_medical' | 'illegal_tuning'
            | 'other' | null
          description: string | null
          logo_url: string | null
          color: string | null
          pin_border_color: string | null
          is_active: boolean
          is_disbanded: boolean
          name_confirmed: boolean
          gang_id: string | null
          hq_x: number | null
          hq_y: number | null
          hq_label: string | null
          hq_wiki_path: string | null
          biz_x: number | null
          biz_y: number | null
          biz_label: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }
      organization_members: {
        Row: {
          id: string
          character_id: string
          organization_id: string
          role: string | null
          is_primary: boolean
          joined_at: string | null
          left_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['organization_members']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['organization_members']['Insert']>
      }
      character_relationships: {
        Row: {
          id: string
          character_a_id: string
          character_b_id: string
          type: 'friend' | 'enemy' | 'rival' | 'family' | 'romantic' | 'ally' | 'mentor' | 'colleague' | 'neutral'
          description: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['character_relationships']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['character_relationships']['Insert']>
      }
      events: {
        Row: {
          id: string
          title: string
          summary: string | null
          content: string | null
          type: 'war' | 'crime' | 'political' | 'social' | 'accident' | 'highlight' | 'other'
          thumbnail_url: string | null
          occurred_at: string | null
          is_published: boolean
          location_x: number | null
          location_y: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
      event_participants: {
        Row: {
          id: string
          event_id: string
          character_id: string
          role: string | null
        }
        Insert: Omit<Database['public']['Tables']['event_participants']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['event_participants']['Insert']>
      }
      event_organizations: {
        Row: {
          id: string
          event_id: string
          organization_id: string
          role: string | null
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['event_organizations']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['event_organizations']['Insert']>
      }
      event_clips: {
        Row: {
          id: string
          event_id: string
          streamer_id: string | null
          clip_url: string
          label: string | null
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['event_clips']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['event_clips']['Insert']>
      }
      reports: {
        Row: {
          id: string
          type: 'new_character' | 'new_event' | 'correction' | 'other'
          title: string
          content: string
          contact: string | null
          contact_method: string | null
          reference_url: string | null
          status: 'pending' | 'reviewing' | 'applied' | 'rejected'
          created_at: string
          ip_hash: string | null
        }
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reports']['Insert']>
      }
      blocked_ips: {
        Row: {
          id: string
          ip_hash: string
          reason: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['blocked_ips']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['blocked_ips']['Insert']>
      }
      bbs_articles: {
        Row: {
          id: string
          title: string
          category: 'info' | 'incident' | 'economy' | 'column' | 'other'
          summary: string | null
          content: string
          thumbnail_url: string | null
          approved_at: string | null
          is_published: boolean
          reporter_character_id: string
          source: 'manual' | 'ingame'
          external_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['bbs_articles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bbs_articles']['Insert']>
      }
      bbs_article_media: {
        Row: {
          id: string
          article_id: string
          image_url: string
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bbs_article_media']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bbs_article_media']['Insert']>
      }
      bbs_article_media_sources: {
        Row: {
          id: string
          article_id: string
          source_url: string
          storage_url: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bbs_article_media_sources']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bbs_article_media_sources']['Insert']>
      }
      bbs_article_reactions: {
        Row: {
          id: string
          article_id: string
          ip_hash: string
          reaction: 'like' | 'dislike'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bbs_article_reactions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bbs_article_reactions']['Insert']>
      }
      bbs_article_comments: {
        Row: {
          id: string
          article_id: string
          author_character_id: string | null
          author_name: string
          content: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bbs_article_comments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bbs_article_comments']['Insert']>
      }
      map_locations: {
        Row: {
          id: string
          name: string
          label: string | null
          description: string | null
          color: string
          x: number | null
          y: number | null
          wiki_path: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['map_locations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['map_locations']['Insert']>
      }
      bongstagram_profiles: {
        Row: {
          character_id: string
          profile_name: string
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['bongstagram_profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bongstagram_profiles']['Insert']>
      }
      bongstagram_posts: {
        Row: {
          id: string
          character_id: string
          post_type: 'post' | 'story'
          content: string
          posted_at: string
          story_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['bongstagram_posts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bongstagram_posts']['Insert']>
      }
      bongstagram_post_media: {
        Row: {
          id: string
          post_id: string
          media_type: 'image' | 'video'
          media_url: string
          storage_path: string | null
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bongstagram_post_media']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bongstagram_post_media']['Insert']>
      }
      bongstagram_post_likes: {
        Row: {
          id: string
          post_id: string
          ip_hash: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bongstagram_post_likes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bongstagram_post_likes']['Insert']>
      }
      bongstagram_story_likes: {
        Row: {
          id: string
          story_id: string
          ip_hash: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bongstagram_story_likes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bongstagram_story_likes']['Insert']>
      }
      bongstagram_post_comments: {
        Row: {
          id: string
          post_id: string
          parent_comment_id: string | null
          author_character_id: string | null
          author_name: string
          content: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bongstagram_post_comments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bongstagram_post_comments']['Insert']>
      }
    }
  }
}

// 편의용 타입 alias
export type Streamer = Database['public']['Tables']['streamers']['Row']
export type Character = Database['public']['Tables']['characters']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']
export type OrgCategory = NonNullable<Organization['category']>
export type OrgType = NonNullable<Organization['type']>
export type OrganizationMember = Database['public']['Tables']['organization_members']['Row']
export type CharacterRelationship = Database['public']['Tables']['character_relationships']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type EventParticipant = Database['public']['Tables']['event_participants']['Row']
export type EventOrganization = Database['public']['Tables']['event_organizations']['Row']
export type EventClip = Database['public']['Tables']['event_clips']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type BbsArticleRecord = Database['public']['Tables']['bbs_articles']['Row']
export type BongstagramProfile = Database['public']['Tables']['bongstagram_profiles']['Row']
export type BongstagramPost = Database['public']['Tables']['bongstagram_posts']['Row']
export type BongstagramPostMedia = Database['public']['Tables']['bongstagram_post_media']['Row']
export type BongstagramPostLike = Database['public']['Tables']['bongstagram_post_likes']['Row']
export type BongstagramStoryLike = Database['public']['Tables']['bongstagram_story_likes']['Row']
export type BongstagramPostComment = Database['public']['Tables']['bongstagram_post_comments']['Row']
