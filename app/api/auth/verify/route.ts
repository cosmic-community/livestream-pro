import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const { isValid, payload } = await validateSession()

    if (!isValid || !payload) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired session'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      session: {
        userId: payload.userId,
        email: payload.email,
        username: payload.username,
        expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null
      }
    })

  } catch (error) {
    console.error('Verify API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}