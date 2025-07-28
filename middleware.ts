import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'

// Define protected routes
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/streamer'
]

// Define auth routes (redirect to dashboard if already authenticated)
const authRoutes = [
  '/login',
  '/register'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )

  try {
    // Get session from cookie
    const session = await getSessionFromCookie()
    const isAuthenticated = !!session

    // If trying to access protected route without authentication
    if (isProtectedRoute && !isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // If trying to access auth routes while already authenticated
    if (isAuthRoute && isAuthenticated) {
      const redirectTo = request.nextUrl.searchParams.get('redirect') || '/dashboard'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }

    // Add user info to headers for server components (optional)
    if (isAuthenticated && session) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', session.userId)
      requestHeaders.set('x-user-email', session.email)
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }

  } catch (error) {
    console.error('Middleware error:', error)
    
    // If there's an error with authentication and trying to access protected route
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}