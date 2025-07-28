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
  // Removed onViewerCountChange to fix Next.js 15 static generation error
}

export interface ViewerCountProps {
  count: number
  isLive: boolean
}

export interface StreamStatusProps {
  status: 'live' | 'offline'
  duration: number
}

export interface StreamSession {
  id: string
  title: string
  slug: string
  metadata: {
    status: 'live' | 'offline'
    stream_key: string
    viewer_count: number
    peak_viewers: number
    started_at: string
    ended_at?: string
    platform: string
    stream_url?: string
    thumbnail?: {
      imgix_url: string
    }
  }
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