import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { registerUser } from '@/lib/auth'
import { setAuthCookie } from '@/lib/session'

const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: validationResult.error.errors[0].message
      }, { status: 400 })
    }

    const { username, email, password, bio } = validationResult.data

    // Register user
    const result = await registerUser({ username, email, password, bio })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }

    // Set auth cookie
    if (result.token) {
      await setAuthCookie(result.token)
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
      message: 'Registration successful'
    })

  } catch (error) {
    console.error('Registration API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}