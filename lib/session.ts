import { cookies } from 'next/headers'
import { JWTPayload, verifyToken, isTokenExpired } from '@/utils/jwt'

const COOKIE_NAME = 'auth-token'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS)
}

export async function getAuthCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const cookie = cookieStore.get(COOKIE_NAME)
    return cookie?.value || null
  } catch (error) {
    console.error('Error getting auth cookie:', error)
    return null
  }
}

export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getSessionFromCookie(): Promise<JWTPayload | null> {
  try {
    const token = await getAuthCookie()
    if (!token) return null

    if (isTokenExpired(token)) {
      await removeAuthCookie()
      return null
    }

    const payload = verifyToken(token)
    return payload
  } catch (error) {
    console.error('Error getting session from cookie:', error)
    await removeAuthCookie()
    return null
  }
}

export async function validateSession(): Promise<{ 
  isValid: boolean
  payload: JWTPayload | null
  token: string | null
}> {
  try {
    const token = await getAuthCookie()
    
    if (!token) {
      return { isValid: false, payload: null, token: null }
    }

    if (isTokenExpired(token)) {
      await removeAuthCookie()
      return { isValid: false, payload: null, token: null }
    }

    const payload = verifyToken(token)
    
    if (!payload) {
      await removeAuthCookie()
      return { isValid: false, payload: null, token: null }
    }

    return { isValid: true, payload, token }
  } catch (error) {
    console.error('Error validating session:', error)
    await removeAuthCookie()
    return { isValid: false, payload: null, token: null }
  }
}

// Client-side session management
export class ClientSession {
  private static readonly STORAGE_KEY = 'auth-session'

  static setSession(token: string, user: any): void {
    if (typeof window === 'undefined') return

    const session = {
      token,
      user,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session))
  }

  static getSession(): { token: string; user: any; expiresAt: string } | null {
    if (typeof window === 'undefined') return null

    try {
      const session = localStorage.getItem(this.STORAGE_KEY)
      if (!session) return null

      const parsed = JSON.parse(session)
      
      // Check if session is expired
      if (new Date(parsed.expiresAt) < new Date()) {
        this.clearSession()
        return null
      }

      return parsed
    } catch (error) {
      console.error('Error getting client session:', error)
      this.clearSession()
      return null
    }
  }

  static clearSession(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.STORAGE_KEY)
  }

  static isAuthenticated(): boolean {
    return this.getSession() !== null
  }

  static getToken(): string | null {
    const session = this.getSession()
    return session?.token || null
  }

  static getUser(): any | null {
    const session = this.getSession()
    return session?.user || null
  }
}