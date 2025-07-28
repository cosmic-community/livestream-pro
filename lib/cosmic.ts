import { createBucketClient } from '@cosmicjs/sdk';
import { 
  StreamSession, 
  PlatformSettings, 
  ViewerAnalytics, 
  CreateStreamSessionData,
  StreamSessionUpdate,
  CosmicResponse 
} from '@/types';

export const cosmic = createBucketClient({
  bucketSlug: process.env.COSMIC_BUCKET_SLUG as string,
  readKey: process.env.COSMIC_READ_KEY as string,
  writeKey: process.env.COSMIC_WRITE_KEY as string,
});

// Simple error helper for Cosmic SDK
function hasStatus(error: unknown): error is { status: number } {
  return typeof error === 'object' && error !== null && 'status' in error;
}

// Stream session functions
export async function getStreamSessions(): Promise<StreamSession[]> {
  try {
    const response = await cosmic.objects
      .find({ type: 'stream-sessions' })
      .props(['id', 'title', 'slug', 'metadata', 'created_at'])
      .sort('-created_at')
      .depth(1);
    
    return response.objects as StreamSession[];
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return [];
    }
    throw new Error('Failed to fetch stream sessions');
  }
}

export async function getActiveStreamSession(): Promise<StreamSession | null> {
  try {
    const response = await cosmic.objects
      .find({ 
        type: 'stream-sessions',
        'metadata.status': 'live'
      })
      .props(['id', 'title', 'slug', 'metadata', 'created_at'])
      .limit(1)
      .depth(1);
    
    return response.objects[0] as StreamSession || null;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch active stream session');
  }
}

export async function createStreamSession(sessionData: CreateStreamSessionData): Promise<StreamSession> {
  try {
    const response = await cosmic.objects.insertOne({
      type: 'stream-sessions',
      title: sessionData.title,
      metadata: sessionData.metadata
    });
    
    return response.object as StreamSession;
  } catch (error) {
    console.error('Error creating stream session:', error);
    throw new Error('Failed to create stream session');
  }
}

export async function updateStreamSession(id: string, updates: StreamSessionUpdate): Promise<StreamSession> {
  try {
    const response = await cosmic.objects.updateOne(id, {
      metadata: updates
    });
    
    return response.object as StreamSession;
  } catch (error) {
    console.error('Error updating stream session:', error);
    throw new Error('Failed to update stream session');
  }
}

// Platform settings functions
export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  try {
    const response = await cosmic.objects
      .find({ type: 'platform-settings' })
      .props(['id', 'title', 'metadata'])
      .limit(1);
    
    return response.objects[0] as PlatformSettings || null;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch platform settings');
  }
}

export async function updatePlatformSettings(settings: Partial<PlatformSettings['metadata']>): Promise<PlatformSettings> {
  try {
    // First, try to get existing settings
    const existing = await getPlatformSettings();
    
    if (existing) {
      const response = await cosmic.objects.updateOne(existing.id, {
        metadata: { ...existing.metadata, ...settings }
      });
      return response.object as PlatformSettings;
    } else {
      // Create new settings if none exist
      const response = await cosmic.objects.insertOne({
        type: 'platform-settings',
        title: 'Platform Settings',
        metadata: {
          stream_title: 'Live Stream',
          stream_description: 'Default stream description',
          ...settings
        }
      });
      return response.object as PlatformSettings;
    }
  } catch (error) {
    console.error('Error updating platform settings:', error);
    throw new Error('Failed to update platform settings');
  }
}

// Viewer analytics functions
export async function createViewerAnalytics(analyticsData: Omit<ViewerAnalytics['metadata'], 'id' | 'created_at' | 'modified_at'>): Promise<ViewerAnalytics> {
  try {
    const response = await cosmic.objects.insertOne({
      type: 'viewer-analytics',
      title: `Viewer ${Date.now()}`,
      metadata: analyticsData
    });
    
    return response.object as ViewerAnalytics;
  } catch (error) {
    console.error('Error creating viewer analytics:', error);
    throw new Error('Failed to create viewer analytics');
  }
}

export async function getStreamAnalytics(sessionId: string): Promise<ViewerAnalytics[]> {
  try {
    const response = await cosmic.objects
      .find({ 
        type: 'viewer-analytics',
        'metadata.session_id': sessionId
      })
      .props(['id', 'metadata', 'created_at'])
      .sort('-created_at');
    
    return response.objects as ViewerAnalytics[];
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return [];
    }
    throw new Error('Failed to fetch stream analytics');
  }
}