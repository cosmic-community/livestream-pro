export interface StreamConfig {
  video: boolean
  audio: boolean
  screen: boolean
  quality: 'auto' | 'high' | 'medium' | 'low'
}

export interface StreamControlsProps {
  isStreaming: boolean
  streamConfig: StreamConfig
  onStartStream: () => void
  onStopStream: () => void
  onConfigChange: (config: StreamConfig) => void
}

export interface StreamPlayerProps {
  streamId?: string
  isStreamer: boolean
  onViewerCountChange?: (count: number) => void
}

export interface ViewerCountProps {
  count: number
  isLive: boolean
}

export interface StreamStatusProps {
  status: 'live' | 'offline'
  duration: number
}

export interface StreamStats {
  isLive: boolean
  viewerCount: number
  duration: number
  bitrate: number
  quality: 'auto' | 'high' | 'medium' | 'low'
}

export interface PeerConfig {
  host: string
  port: number
  path: string
  secure: boolean
}

export interface StreamSession {
  id: string
  title: string
  slug: string
  created_at: string
  metadata: {
    status: 'live' | 'offline'
    stream_key: string
    viewer_count: number
    peak_viewers: number
    started_at: string
    start_time: string
    end_time?: string
    ended_at?: string
    duration?: number
    platform: string
    stream_url?: string
    stream_type?: string
    tags?: string[]
    thumbnail?: {
      imgix_url: string
    }
  }
}

export interface CreateStreamSessionData {
  type: string
  title: string
  slug: string
  metadata: {
    start_time: string
    viewer_count: number
    peak_viewers: number
    status: 'live' | 'offline'
    stream_type: string
    tags: string[]
  }
}

export interface StreamSessionUpdate {
  end_time?: string
  duration?: number
  status?: 'live' | 'offline' | 'ended'
  viewer_count?: number
  peak_viewers?: number
}

export interface ViewerAnalytics {
  id: string
  title: string
  slug: string
  created_at: string
  modified_at: string
  metadata: {
    session_id: string
    viewer_id: string
    join_time: string
    leave_time?: string
    duration?: number
    device_type: string
    location?: {
      country: string
      city: string
    }
  }
}

export interface CosmicResponse<T> {
  object?: T
  objects: T[]
  total: number
}

export interface PlatformSettings {
  id: string
  title: string
  slug: string
  metadata: {
    stream_title: string
    stream_description: string
    platform_name: string
    chat_enabled: boolean
    donations_enabled: boolean
    subscriber_only_chat: boolean
    overlay_theme: 'dark' | 'light'
    primary_color: string
    secondary_color: string
    default_quality?: string
    enable_chat?: boolean
    enable_analytics?: boolean
    auto_record?: boolean
  }
}

// Site Settings interface matching the Cosmic CMS structure
export interface SiteSettings {
  id: string
  title: string
  slug: string
  metadata: {
    livechat_enabled: boolean
    livechat_widget_id: string
    maintenance_mode: boolean
    maintenance_message: string
    contact_email: string
    google_analytics_id: string
  }
}