import { NextRequest, NextResponse } from 'next/server'
import { createStreamSession } from '@/lib/cosmic'
import { CreateStreamSessionData } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, streamType, quality } = body

    if (!title || !streamType) {
      return NextResponse.json(
        { error: 'Title and stream type are required' },
        { status: 400 }
      )
    }

    const sessionData: CreateStreamSessionData = {
      type: 'stream-sessions',
      title,
      slug: `stream-${Date.now()}`,
      metadata: {
        start_time: new Date().toISOString(),
        viewer_count: 0,
        peak_viewers: 0,
        status: 'live',
        stream_type: streamType,
        tags: ['live'],
      }
    }

    const session = await createStreamSession(sessionData)

    return NextResponse.json({
      success: true,
      session
    })
  } catch (error) {
    console.error('Error starting stream:', error)
    return NextResponse.json(
      { error: 'Failed to start stream session' },
      { status: 500 }
    )
  }
}