import { NextRequest, NextResponse } from 'next/server'
import { getStreamSession, updateStreamSession } from '@/lib/cosmic'
import { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required',
        message: 'Please provide a valid session ID'
      } as ApiResponse, { status: 400 })
    }

    const session = await getStreamSession(sessionId)
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Stream session not found',
        message: 'The requested stream session does not exist'
      } as ApiResponse, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: session.id,
        status: session.metadata.status,
        viewer_count: session.metadata.viewer_count,
        duration: session.metadata.duration,
        started_at: session.metadata.started_at,
        title: session.title
      }
    } as ApiResponse)

  } catch (error: unknown) {
    console.error('Error fetching stream status:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch stream status'
    } as ApiResponse, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, status, viewerCount, duration } = body

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required',
        message: 'Please provide a valid session ID'
      } as ApiResponse, { status: 400 })
    }

    if (!status || !['scheduled', 'live', 'ended', 'error'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status',
        message: 'Status must be one of: scheduled, live, ended, error'
      } as ApiResponse, { status: 400 })
    }

    // Get current session to preserve existing data
    const currentSession = await getStreamSession(sessionId)
    if (!currentSession) {
      return NextResponse.json({
        success: false,
        error: 'Stream session not found',
        message: 'The requested stream session does not exist'
      } as ApiResponse, { status: 404 })
    }

    const updateData: any = {
      status
    }

    if (typeof viewerCount === 'number') {
      updateData.viewer_count = viewerCount
      // Update peak viewers if current count is higher
      updateData.peak_viewers = Math.max(currentSession.metadata.peak_viewers || 0, viewerCount)
    }

    if (typeof duration === 'number') {
      updateData.duration = duration
    }

    if (status === 'live' && !currentSession.metadata.started_at) {
      updateData.started_at = new Date().toISOString()
    }

    if (status === 'ended') {
      updateData.ended_at = new Date().toISOString()
    }

    const updatedSession = await updateStreamSession(sessionId, updateData)

    return NextResponse.json({
      success: true,
      data: updatedSession
    } as ApiResponse)

  } catch (error: unknown) {
    console.error('Error updating stream status:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update stream status'
    } as ApiResponse, { status: 500 })
  }
}