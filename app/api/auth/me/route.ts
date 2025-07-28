import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'
import { getUserById } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const session = await getSessionFromCookie()
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Get current user data
    const user = await getUserById(session.userId)
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user
    })

  } catch (error) {
    console.error('Me API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}