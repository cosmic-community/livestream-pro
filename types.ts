// Base Cosmic object interface
interface CosmicObject {
  id: string;
  slug: string;
  title: string;
  content?: string;
  metadata: Record<string, any>;
  type: string;
  created_at: string;
  modified_at: string;
}

// Stream session object type
interface StreamSession extends CosmicObject {
  type: 'stream-sessions';
  metadata: {
    start_time: string;
    end_time?: string;
    duration?: number;
    viewer_count: number;
    peak_viewers: number;
    status: StreamStatus;
    stream_type: StreamType;
    thumbnail?: {
      url: string;
      imgix_url: string;
    };
    description?: string;
    tags?: string[];
  };
}

// Platform settings object type
interface PlatformSettings extends CosmicObject {
  type: 'platform-settings';
  metadata: {
    stream_title: string;
    stream_description?: string;
    default_quality: StreamQuality;
    enable_chat: boolean;
    enable_analytics: boolean;
    max_viewers?: number;
    auto_record: boolean;
  };
}

// Viewer analytics object type
interface ViewerAnalytics extends CosmicObject {
  type: 'viewer-analytics';
  metadata: {
    session_id: string;
    viewer_ip?: string;
    join_time: string;
    leave_time?: string;
    watch_duration?: number;
    device_type: DeviceType;
    browser?: string;
    location?: {
      country?: string;
      city?: string;
    };
  };
}

// Type literals for select-dropdown values
type StreamStatus = 'live' | 'ended' | 'scheduled' | 'error';
type StreamType = 'webcam' | 'screen' | 'both';
type StreamQuality = 'low' | 'medium' | 'high' | 'auto';
type DeviceType = 'desktop' | 'mobile' | 'tablet';

// API response types
interface CosmicResponse<T> {
  objects: T[];
  total: number;
  limit: number;
  skip: number;
}

// WebRTC and streaming types
interface StreamConfig {
  video: boolean;
  audio: boolean;
  screen: boolean;
  quality: StreamQuality;
}

interface PeerConfig {
  host: string;
  port: number;
  path: string;
  secure: boolean;
}

interface StreamStats {
  isLive: boolean;
  viewerCount: number;
  duration: number;
  bitrate: number;
  quality: StreamQuality;
}

// Component prop types
interface StreamPlayerProps {
  streamId?: string;
  isStreamer: boolean;
  onViewerCountChange: (count: number) => void;
}

interface StreamControlsProps {
  isStreaming: boolean;
  streamConfig: StreamConfig;
  onStartStream: () => void;
  onStopStream: () => void;
  onConfigChange: (config: StreamConfig) => void;
}

interface ViewerCountProps {
  count: number;
  isLive: boolean;
}

interface StreamStatusProps {
  status: StreamStatus;
  duration: number;
}

// Utility types
type CreateStreamSessionData = Omit<StreamSession, 'id' | 'created_at' | 'modified_at'>;
type StreamSessionUpdate = Partial<StreamSession['metadata']>;

// Type guards
function isStreamSession(obj: CosmicObject): obj is StreamSession {
  return obj.type === 'stream-sessions';
}

function isPlatformSettings(obj: CosmicObject): obj is PlatformSettings {
  return obj.type === 'platform-settings';
}

function isViewerAnalytics(obj: CosmicObject): obj is ViewerAnalytics {
  return obj.type === 'viewer-analytics';
}

// Export all types
export type {
  CosmicObject,
  StreamSession,
  PlatformSettings,
  ViewerAnalytics,
  StreamStatus,
  StreamType,
  StreamQuality,
  DeviceType,
  CosmicResponse,
  StreamConfig,
  PeerConfig,
  StreamStats,
  StreamPlayerProps,
  StreamControlsProps,
  ViewerCountProps,
  StreamStatusProps,
  CreateStreamSessionData,
  StreamSessionUpdate,
};

export {
  isStreamSession,
  isPlatformSettings,
  isViewerAnalytics,
};