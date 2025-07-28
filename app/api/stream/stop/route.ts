import { NextRequest, NextResponse } from 'next/server'
import { updateStreamSession } from '@/lib/cosmic'
import { StreamSessionUpdate } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, viewerCount, duration } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const updateData: StreamSessionUpdate = {
      end_time: new Date().toISOString(),
      duration: duration || 0,
      status: 'ended',
      viewer_count: viewerCount || 0,
      peak_viewers: viewerCount || 0,
      ended_at: new Date().toISOString()
    }

    const updatedSession = await updateStreamSession(sessionId, updateData)

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