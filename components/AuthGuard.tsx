'use client'

import { useAuth } from '@/hooks/useAuth'
import { ReactNode } from 'react'

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
  requireAuth?: boolean
}

export default function AuthGuard({ 
  children, 
  fallback = <AuthLoadingSpinner />,
  requireAuth = true 
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()

  // Show loading state while checking authentication
  if (isLoading) {
    return <>{fallback}</>
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <AuthRedirect />
  }

  // If user is authenticated or authentication is not required
  return <>{children}</>
}

function AuthLoadingSpinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Checking authentication...</p>
      </div>
    </div>
  )
}

function AuthRedirect() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <div className="bg-muted/30 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to access this page.
          </p>
          <div className="space-y-3">
            <a
              href="/login"
              className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Sign In
            </a>
            <a
              href="/register"
              className="block w-full py-2 px-4 bg-transparent border border-border hover:bg-muted/50 text-foreground font-medium rounded-lg transition-colors"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Higher-order component for protecting pages
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: { requireAuth?: boolean; fallback?: ReactNode } = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <AuthGuard 
        requireAuth={options.requireAuth ?? true}
        fallback={options.fallback}
      >
        <Component {...props} />
      </AuthGuard>
    )
  }

  WrappedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`
  
  return WrappedComponent
}