import { NextRequest, NextResponse } from 'next/server'
import { removeAuthCookie } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    // Remove auth cookie
    await removeAuthCookie()

    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    })

  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}