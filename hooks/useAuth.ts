'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, AuthContextType, LoginCredentials, RegisterData } from '@/types'
import { ClientSession } from '@/lib/session'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const session = ClientSession.getSession()
        if (session && session.user) {
          setUser(session.user)
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        ClientSession.clearSession()
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (data.success && data.user && data.token) {
        setUser(data.user)
        ClientSession.setSession(data.token, data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success && result.user && result.token) {
        setUser(result.user)
        ClientSession.setSession(result.token, result.user)
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Registration failed' }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setIsLoading(true)
    
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      ClientSession.clearSession()
      setIsLoading(false)
    }
  }

  const refreshUser = async (): Promise<void> => {
    try {
      const token = ClientSession.getToken()
      if (!token) return

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success && data.user) {
        setUser(data.user)
        ClientSession.setSession(token, data.user)
      } else {
        // If refresh fails, logout user
        await logout()
      }
    } catch (error) {
      console.error('Refresh user error:', error)
      await logout()
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Utility hook for checking authentication status
export function useRequireAuth() {
  const { user, isLoading } = useAuth()
  
  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = '/login'
    }
  }, [user, isLoading])

  return { user, isLoading, isAuthenticated: !!user }
}

// Hook for optional authentication (doesn't redirect)
export function useOptionalAuth() {
  const { user, isLoading } = useAuth()
  return { user, isLoading, isAuthenticated: !!user }
}