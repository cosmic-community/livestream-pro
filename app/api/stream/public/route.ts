import { NextRequest, NextResponse } from 'next/server'
import { getStreamSession, getStreamSessions, getSiteSettings } from '@/lib/cosmic'
import { ApiResponse, StreamSession } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const streamId = searchParams.get('streamId')
    const status = searchParams.get('status') as 'live' | 'scheduled' | 'ended' | null
    const limit = parseInt(searchParams.get('limit') || '10')

    // Check site maintenance mode
    try {
      const siteSettings = await getSiteSettings()
      if (siteSettings?.metadata.maintenance_mode) {
        return NextResponse.json({
          success: false,
          error: 'Site is currently in maintenance mode',
          message: siteSettings.metadata.maintenance_message || 'Please check back later'
        } as ApiResponse, { status: 503 })
      }
    } catch (error) {
      // Continue if site settings are not available
      console.log('Site settings not available:', error)
    }

    // Get specific stream
    if (streamId) {
      const session = await getStreamSession(streamId)
      
      if (!session) {
        return NextResponse.json({
          success: false,
          error: 'Stream not found',
          message: 'The requested stream does not exist'
        } as ApiResponse, { status: 404 })
      }

      // Only return public stream data
      const publicSession: Partial<StreamSession> = {
        id: session.id,
        title: session.title,
        slug: session.slug,
        created_at: session.created_at,
        metadata: {
          status: session.metadata.status,
          viewer_count: session.metadata.viewer_count,
          peak_viewers: session.metadata.peak_viewers,
          duration: session.metadata.duration,
          started_at: session.metadata.started_at,
          ended_at: session.metadata.ended_at,
          title: session.metadata.title,
          description: session.metadata.description,
          thumbnail: session.metadata.thumbnail,
          tags: session.metadata.tags,
          category: session.metadata.category,
          stream_type: session.metadata.stream_type,
          quality: session.metadata.quality,
          // Exclude sensitive data like stream_key, rtmp_url
          platform: session.metadata.platform
        }
      }

      return NextResponse.json({
        success: true,
        data: publicSession
      } as ApiResponse<Partial<StreamSession>>)
    }

    // Get list of streams
    const sessions = await getStreamSessions(limit)
    
    // Filter by status if provided
    let filteredSessions = sessions
    if (status) {
      filteredSessions = sessions.filter(session => session.metadata.status === status)
    }

    // Only return public data for all sessions
    const publicSessions = filteredSessions.map(session => ({
      id: session.id,
      title: session.title,
      slug: session.slug,  
      created_at: session.created_at,
      metadata: {
        status: session.metadata.status,
        viewer_count: session.metadata.viewer_count,
        peak_viewers: session.metadata.peak_viewers,
        duration: session.metadata.duration,
        started_at: session.metadata.started_at,
        ended_at: session.metadata.ended_at,
        title: session.metadata.title,
        description: session.metadata.description,
        thumbnail: session.metadata.thumbnail,
        tags: session.metadata.tags,
        category: session.metadata.category,
        stream_type: session.metadata.stream_type,
        quality: session.metadata.quality,
        platform: session.metadata.platform
      }
    }))

    return NextResponse.json({
      success: true,
      data: publicSessions,
      total: publicSessions.length
    } as ApiResponse<Partial<StreamSession>[]>)

  } catch (error: unknown) {
    console.error('Error fetching public stream data:', error)
    
    const err = error as Error
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch stream data'
    } as ApiResponse, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { streamId, action } = body

    if (!streamId || !action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters',
        message: 'streamId and action are required'
      } as ApiResponse, { status: 400 })
    }

    // Check site maintenance mode
    try {
      const siteSettings = await getSiteSettings()
      if (siteSettings?.metadata.maintenance_mode) {
        return NextResponse.json({
          success: false,
          error: 'Site is currently in maintenance mode',
          message: siteSettings.metadata.maintenance_message || 'Please check back later'
        } as ApiResponse, { status: 503 })
      }
    } catch (error) {
      // Continue if site settings are not available
      console.log('Site settings not available:', error)
    }

    const session = await getStreamSession(streamId)
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Stream not found',
        message: 'The requested stream does not exist'
      } as ApiResponse, { status: 404 })
    }

    switch (action) {
      case 'join':
        // Increment viewer count (in a real implementation, you'd track this more carefully)
        // For now, just return success
        return NextResponse.json({
          success: true,
          data: {
            message: 'Joined stream successfully',
            viewerCount: session.metadata.viewer_count + 1
          }
        } as ApiResponse)

      case 'leave':
        // Decrement viewer count
        return NextResponse.json({
          success: true,
          data: {
            message: 'Left stream successfully',
            viewerCount: Math.max(0, session.metadata.viewer_count - 1)
          }
        } as ApiResponse)

      case 'heartbeat':
        // Keep-alive for viewer tracking
        return NextResponse.json({
          success: true,
          data: {
            message: 'Heartbeat received',
            timestamp: new Date().toISOString()
          }
        } as ApiResponse)

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          message: 'Supported actions: join, leave, heartbeat'
        } as ApiResponse, { status: 400 })
    }

  } catch (error: unknown) {
    console.error('Error handling public stream action:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process request'
    } as ApiResponse, { status: 500 })
  }
}