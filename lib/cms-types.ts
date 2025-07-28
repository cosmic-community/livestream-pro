import { CosmicObject } from '@/types'

// Base Cosmic File Type
export interface CosmicFile {
  url: string
  imgix_url: string
}

// Stream Categories
export interface StreamCategory extends CosmicObject {
  type: 'stream-categories'
  metadata: {
    name: string
    description?: string
    icon?: CosmicFile
    color?: string
    is_active: boolean
  }
}

// Streamers
export interface Streamer extends CosmicObject {
  type: 'streamers'
  metadata: {
    username: string
    email: string
    password_hash?: string
    profile_image?: CosmicFile
    bio?: string
    is_live: boolean
    personal_stream_key?: string
    follower_count: number
    total_views: number
    account_status: {
      key: string
      value: string
    }
    social_links?: Record<string, string>
  }
}

// Live Streams
export interface LiveStream extends CosmicObject {
  type: 'live-streams'
  metadata: {
    stream_title: string
    streamer: Streamer
    stream_status: {
      key: 'live' | 'offline' | 'scheduled' | 'ended'
      value: string
    }
    stream_url?: string
    stream_key?: string
    thumbnail?: CosmicFile
    category?: StreamCategory
    viewer_count: number
    started_at?: string
    description?: string
    tags?: string
    is_featured: boolean
  }
}

// Site Settings
export interface CosmicSiteSettings extends CosmicObject {
  type: 'site-settings'
  metadata: {
    livechat_enabled: boolean
    livechat_widget_id: string
    maintenance_mode: boolean
    maintenance_message: string
    contact_email: string
    google_analytics_id: string
  }
}

// Query response types
export interface CosmicQueryResponse<T> {
  objects?: T[]
  object?: T
  total?: number
}

// Helper type for creating objects
export type CreateStreamCategoryData = Omit<StreamCategory, 'id' | 'created_at' | 'modified_at' | 'status'>
export type CreateStreamerData = Omit<Streamer, 'id' | 'created_at' | 'modified_at' | 'status'>
export type CreateLiveStreamData = Omit<LiveStream, 'id' | 'created_at' | 'modified_at' | 'status'>

// Update data types
export type UpdateStreamCategoryData = Partial<StreamCategory['metadata']>
export type UpdateStreamerData = Partial<Streamer['metadata']>
export type UpdateLiveStreamData = Partial<LiveStream['metadata']>

// Filter types for queries
export interface StreamCategoryFilters {
  is_active?: boolean
}

export interface StreamerFilters {
  is_live?: boolean
  account_status?: string
}

export interface LiveStreamFilters {
  status?: 'live' | 'offline' | 'scheduled' | 'ended'
  category?: string
  streamer?: string
  is_featured?: boolean
}

// Sort options
export type SortOption = 'created_at' | '-created_at' | 'modified_at' | '-modified_at' | 'title' | '-title'

// Common query options
export interface QueryOptions {
  limit?: number
  skip?: number
  sort?: SortOption
  depth?: number
  props?: string[]
}