import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateUser } from '@/lib/auth'
import { setAuthCookie } from '@/lib/session'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: validationResult.error.errors[0].message
      }, { status: 400 })
    }

    const { email, password } = validationResult.data

    // Authenticate user
    const result = await authenticateUser({ email, password })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 401 })
    }

    // Set auth cookie
    if (result.token) {
      await setAuthCookie(result.token)
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
      message: 'Login successful'
    })

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}