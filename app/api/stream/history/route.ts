import { NextResponse } from 'next/server'
import { getStreamSessions } from '@/lib/cosmic'

export async function GET() {
  try {
    const sessions = await getStreamSessions()

    return NextResponse.json({
      success: true,
      sessions
    })
  } catch (error) {
    console.error('Error fetching stream history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stream history' },
      { status: 500 }
    )
  }
}