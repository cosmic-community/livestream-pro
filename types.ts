import { ReactNode } from 'react'

// Cosmic CMS Types
export interface CosmicObject {
  id: string
  title: string
  slug: string
  type: string
  status: 'published' | 'draft'
  created_at: string
  modified_at: string
  metadata: Record<string, any>
}

export interface CosmicResponse<T = any> {
  objects?: T[]
  object?: T
  total?: number
  success?: boolean
  error?: string
}

// Stream Types
export interface StreamSession extends CosmicObject {
  metadata: {
    status: 'scheduled' | 'live' | 'ended' | 'error'
    platform: 'youtube' | 'twitch' | 'custom'
    stream_key?: string
    rtmp_url?: string
    viewer_count: number
    peak_viewers: number
    duration: number
    started_at?: string
    ended_at?: string
    start_time?: string
    end_time?: string
    title: string
    description?: string
    thumbnail?: {
      url: string
      imgix_url: string
    }
    tags?: string[]
    category?: string
  }
}

export interface CreateStreamSessionData {
  type: 'stream-sessions'
  title: string
  slug: string
  metadata: {
    start_time: string
    viewer_count: number
    peak_viewers: number
    status: 'scheduled' | 'live' | 'ended' | 'error'
    stream_type: string
    tags: string[]
  }
}

export interface StreamSessionUpdate {
  end_time?: string
  duration?: number
  status?: 'scheduled' | 'live' | 'ended' | 'error'
  viewer_count?: number
  peak_viewers?: number
  start_time?: string
  started_at?: string
  ended_at?: string
}

export interface StreamConfig {
  video: boolean
  audio: boolean
  screen: boolean
  quality: 'auto' | 'low' | 'medium' | 'high'
}

export interface StreamStats {
  isLive: boolean
  viewerCount: number
  duration: number
  bitrate: number
  quality: 'auto' | 'low' | 'medium' | 'high'
}

export interface PeerConfig {
  host: string
  port: number
  path: string
  secure: boolean
}

// Component Props Types
export interface StreamPlayerProps {
  streamId?: string
  isStreamer: boolean
  className?: string
  onViewerCountChange?: (count: number) => void
}

export interface StreamControlsProps {
  isStreaming: boolean
  streamConfig: StreamConfig
  onStartStream: () => Promise<void>
  onStopStream: () => Promise<void>
  onConfigChange: (config: StreamConfig) => void
}

export interface StreamStatusProps {
  status: 'live' | 'scheduled' | 'ended' | 'error' | 'offline'
  duration: number
}

export interface ViewerCountProps {
  count: number
  isLive: boolean
}

export interface StreamHistoryProps {
  limit?: number
}

export interface StreamAnalyticsProps {
  sessionId?: string
  timeRange?: '24h' | '7d' | '30d'
}

// Platform Settings
export interface PlatformSettings extends CosmicObject {
  metadata: {
    stream_title: string
    stream_description: string
    default_thumbnail?: {
      url: string
      imgix_url: string
    }
    rtmp_settings?: {
      server_url: string
      stream_key: string
    }
    social_links?: {
      youtube?: string
      twitch?: string
      twitter?: string
      discord?: string
    }
    branding?: {
      logo?: {
        url: string
        imgix_url: string
      }
      primary_color?: string
      secondary_color?: string
    }
  }
}

// Site Settings
export interface SiteSettings extends CosmicObject {
  metadata: {
    livechat_enabled: boolean
    livechat_widget_id: string
    maintenance_mode: boolean
    maintenance_message: string
    contact_email: string
    google_analytics_id: string
  }
}

// Analytics Types
export interface ViewerAnalytics extends CosmicObject {
  metadata: {
    session_id: string
    timestamp: string
    viewer_count: number
    duration: number
    platform: string
    quality_metrics?: {
      bitrate: number
      fps: number
      dropped_frames: number
    }
    engagement_metrics?: {
      chat_messages: number
      reactions: number
      shares: number
    }
  }
}

export interface StreamAnalytics extends CosmicObject {
  metadata: {
    session_id: string
    timestamp: string
    viewer_count: number
    duration: number
    platform: string
    quality_metrics?: {
      bitrate: number
      fps: number
      dropped_frames: number
    }
    engagement_metrics?: {
      chat_messages: number
      reactions: number
      shares: number
    }
  }
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Error Types
export interface StreamError {
  code: string
  message: string
  details?: Record<string, any>
}

// UI Component Types
export interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Form Types
export interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: Array<{ value: string; label: string }>
  error?: string
  helpText?: string
}

// Navigation Types
export interface NavItem {
  label: string
  href: string
  icon?: ReactNode
  badge?: string | number
  active?: boolean
  children?: NavItem[]
}

// Layout Types
export interface LayoutProps {
  children: ReactNode
  title?: string
  description?: string
  noIndex?: boolean
  className?: string
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>