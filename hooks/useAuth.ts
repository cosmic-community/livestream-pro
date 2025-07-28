'use client'

import { useEffect } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { User } from '@/types'

export function useAuth() {
  return useAuthContext()
}

// Utility hook for checking authentication status
export function useRequireAuth(): { user: User | null; isLoading: boolean; isAuthenticated: boolean } {
  const { user, isLoading } = useAuth()
  
  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = '/login'
    }
  }, [user, isLoading])

  return { user, isLoading, isAuthenticated: !!user }
}

// Hook for optional authentication (doesn't redirect)
export function useOptionalAuth(): { user: User | null; isLoading: boolean; isAuthenticated: boolean } {
  const { user, isLoading } = useAuth()
  return { user, isLoading, isAuthenticated: !!user }
}