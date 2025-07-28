import { NextRequest, NextResponse } from 'next/server'
import { getActiveStreamSession, updateStreamSession } from '@/lib/cosmic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { viewerCount, duration } = body

    // Get the active stream session
    const activeSession = await getActiveStreamSession()
    
    if (!activeSession) {
      return NextResponse.json(
        { error: 'No active stream session found' },
        { status: 404 }
      )
    }

    // Calculate session duration if not provided
    const startTime = new Date(activeSession.metadata.start_time || activeSession.metadata.started_at)
    const endTime = new Date()
    const calculatedDuration = duration || Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

    // Update the session
    const updatedSession = await updateStreamSession(activeSession.id, {
      end_time: endTime.toISOString(),
      duration: calculatedDuration,
      status: 'ended',
      viewer_count: viewerCount || 0,
      peak_viewers: Math.max(activeSession.metadata.peak_viewers, viewerCount || 0)
    })

    return NextResponse.json({
      success: true,
      session: updatedSession
    })
  } catch (error) {
    console.error('Error stopping stream:', error)
    return NextResponse.json(
      { error: 'Failed to stop stream session' },
      { status: 500 }
    )
  }
}