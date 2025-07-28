import { createBucketClient } from '@cosmicjs/sdk'
import { 
  CosmicResponse, 
  StreamSession, 
  CreateStreamSessionData,
  StreamSessionUpdate,
  SiteSettings,
  PlatformSettings,
  StreamAnalytics 
} from '@/types'

// Cosmic client for server-side operations (with write access)
const cosmic = createBucketClient({
  bucketSlug: process.env.COSMIC_BUCKET_SLUG as string,
  readKey: process.env.COSMIC_READ_KEY as string,
  writeKey: process.env.COSMIC_WRITE_KEY as string,
})

// Cosmic client for client-side operations (read-only)
export const cosmicRead = createBucketClient({
  bucketSlug: process.env.COSMIC_BUCKET_SLUG as string,
  readKey: process.env.COSMIC_READ_KEY as string,
})

// Stream Sessions
export async function getStreamSessions(limit: number = 10): Promise<StreamSession[]> {
  try {
    const { objects } = await cosmic.objects
      .find({ type: 'stream-sessions' })
      .props(['id', 'title', 'slug', 'created_at', 'metadata'])
      .depth(1)
      .limit(limit)
      .sort('-created_at')

    return objects || []
  } catch (error: unknown) {
    console.error('Error fetching stream sessions:', error)
    const err = error as { status?: number }
    if (err && err.status === 404) {
      return []
    }
    throw error
  }
}

export async function getStreamSession(id: string): Promise<StreamSession | null> {
  try {
    const { object } = await cosmic.objects
      .findOne({ type: 'stream-sessions', id })
      .props(['id', 'title', 'slug', 'created_at', 'metadata'])
      .depth(1)

    return object || null
  } catch (error: unknown) {
    console.error('Error fetching stream session:', error)
    const err = error as { status?: number }
    if (err && err.status === 404) {
      return null
    }
    throw error
  }
}

export async function createStreamSession(data: CreateStreamSessionData): Promise<StreamSession> {
  try {
    const { object } = await cosmic.objects.insertOne({
      title: data.title,
      type: data.type,
      slug: data.slug,
      status: 'published',
      metadata: data.metadata
    })

    return object
  } catch (error: unknown) {
    console.error('Error creating stream session:', error)
    throw error
  }
}

export async function updateStreamSession(
  id: string, 
  updateData: StreamSessionUpdate
): Promise<StreamSession> {
  try {
    const { object } = await cosmic.objects.updateOne(id, {
      metadata: updateData
    })

    return object
  } catch (error: unknown) {
    console.error('Error updating stream session:', error)
    throw error
  }
}

export async function deleteStreamSession(id: string): Promise<void> {
  try {
    await cosmic.objects.deleteOne(id)
  } catch (error: unknown) {
    console.error('Error deleting stream session:', error)
    throw error
  }
}

// Site Settings
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const { object } = await cosmic.objects
      .findOne({ type: 'site-settings' })
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1)

    return object || null
  } catch (error: unknown) {
    console.error('Error fetching site settings:', error)
    const err = error as { status?: number }
    if (err && err.status === 404) {
      return null
    }
    throw error
  }
}

export async function updateSiteSettings(
  id: string,
  metadata: Partial<SiteSettings['metadata']>
): Promise<SiteSettings> {
  try {
    const { object } = await cosmic.objects.updateOne(id, {
      metadata
    })

    return object
  } catch (error: unknown) {
    console.error('Error updating site settings:', error)
    throw error
  }
}

// Platform Settings
export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  try {
    const { object } = await cosmic.objects
      .findOne({ type: 'platform-settings' })
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1)

    return object || null
  } catch (error: unknown) {
    console.error('Error fetching platform settings:', error)
    const err = error as { status?: number }
    if (err && err.status === 404) {
      return null
    }
    throw error
  }
}

export async function updatePlatformSettings(
  id: string,
  metadata: Partial<PlatformSettings['metadata']>
): Promise<PlatformSettings> {
  try {
    const { object } = await cosmic.objects.updateOne(id, {
      metadata
    })

    return object
  } catch (error: unknown) {
    console.error('Error updating platform settings:', error)
    throw error
  }
}

// Analytics
export async function createStreamAnalytics(data: {
  type: 'stream-analytics'
  title: string
  slug: string
  metadata: StreamAnalytics['metadata']
}): Promise<StreamAnalytics> {
  try {
    const { object } = await cosmic.objects.insertOne({
      title: data.title,
      type: data.type,
      slug: data.slug,
      status: 'published',
      metadata: data.metadata
    })

    return object
  } catch (error: unknown) {
    console.error('Error creating stream analytics:', error)
    throw error
  }
}

export async function getStreamAnalytics(
  sessionId?: string,
  timeRange?: '24h' | '7d' | '30d',
  limit: number = 100
): Promise<StreamAnalytics[]> {
  try {
    let query: any = { type: 'stream-analytics' }
    
    if (sessionId) {
      query['metadata.session_id'] = sessionId
    }

    // Add time range filter if specified
    if (timeRange) {
      const now = new Date()
      let startDate: Date
      
      switch (timeRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      }
      
      // Note: This is a simplified time filter - in production you might want
      // to use Cosmic's date filtering capabilities if available
    }

    const { objects } = await cosmic.objects
      .find(query)
      .props(['id', 'title', 'slug', 'created_at', 'metadata'])
      .depth(1)
      .limit(limit)
      .sort('-created_at')

    return objects || []
  } catch (error: unknown) {
    console.error('Error fetching stream analytics:', error)
    const err = error as { status?: number }
    if (err && err.status === 404) {
      return []
    }
    throw error
  }
}

// Utility functions
export async function getObjectById<T = any>(id: string): Promise<T | null> {
  try {
    const { object } = await cosmic.objects
      .findOne({ id })
      .props(['id', 'title', 'slug', 'type', 'created_at', 'metadata'])
      .depth(1)

    return object || null
  } catch (error: unknown) {
    console.error('Error fetching object by ID:', error)
    const err = error as { status?: number }
    if (err && err.status === 404) {
      return null
    }
    throw error
  }
}

export async function searchObjects(
  type: string,
  searchTerm: string,
  limit: number = 10
): Promise<any[]> {
  try {
    // Note: Cosmic doesn't have built-in full-text search
    // This is a simplified search that looks for the term in titles
    const { objects } = await cosmic.objects
      .find({ type })
      .props(['id', 'title', 'slug', 'created_at', 'metadata'])
      .depth(1)
      .limit(limit)

    // Filter results that contain the search term (case-insensitive)
    const filtered = objects?.filter((obj: any) => 
      obj.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(obj.metadata).toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    return filtered
  } catch (error: unknown) {
    console.error('Error searching objects:', error)
    const err = error as { status?: number }
    if (err && err.status === 404) {
      return []
    }
    throw error
  }
}