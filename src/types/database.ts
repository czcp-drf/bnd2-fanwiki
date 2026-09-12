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
          is_active: boolean
          is_disbanded: boolean
          name_confirmed: boolean
          gang_id: string | null
          hq_x: number | null
          hq_y: number | null
          hq_label: string | null
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
          type: 'war' | 'crime' | 'political' | 'social' | 'accident' | 'other'
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
          ip: string | null
        }
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reports']['Insert']>
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
export type EventClip = Database['public']['Tables']['event_clips']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type BongstagramProfile = Database['public']['Tables']['bongstagram_profiles']['Row']
