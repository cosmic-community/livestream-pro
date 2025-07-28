import { NextResponse } from 'next/server'
import { getStreamSessions } from '@/lib/cosmic'

export async function GET() {
  try {
    const sessions = await getStreamSessions()

    // Calculate analytics from session data with proper null checks
    const totalViews = sessions.reduce((sum, session) => sum + (session.metadata?.peak_viewers || 0), 0)
    const totalHours = sessions.reduce((sum, session) => {
      const duration = session.metadata?.duration || 0
      return sum + (duration / 3600)
    }, 0)
    const averageViewers = sessions.length > 0 ? totalViews / sessions.length : 0

    // Mock top countries data (in real app, this would come from viewer analytics)
    const topCountries = [
      { country: 'United States', viewers: Math.floor(totalViews * 0.4) },
      { country: 'Canada', viewers: Math.floor(totalViews * 0.2) },
      { country: 'United Kingdom', viewers: Math.floor(totalViews * 0.15) },
    ]

    return NextResponse.json({
      totalViews,
      totalHours,
      averageViewers,
      topCountries,
      sessionsCount: sessions.length
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}