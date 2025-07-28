import jwt from 'jsonwebtoken'
import { User } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  username: string
  iat?: number
  exp?: number
}

export function signToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.metadata.email,
    username: user.metadata.username,
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload
    return decoded
  } catch (error) {
    console.error('JWT decode failed:', error)
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token)
    if (!decoded || !decoded.exp) return true
    
    const currentTime = Math.floor(Date.now() / 1000)
    return decoded.exp < currentTime
  } catch (error) {
    return true
  }
}

export function getTokenExpirationTime(token: string): Date | null {
  try {
    const decoded = decodeToken(token)
    if (!decoded || !decoded.exp) return null
    
    return new Date(decoded.exp * 1000)
  } catch (error) {
    return null
  }
}

export function refreshTokenIfNeeded(token: string, user: User): string | null {
  if (isTokenExpired(token)) {
    return signToken(user)
  }
  
  // If token expires within 1 hour, refresh it
  const expirationTime = getTokenExpirationTime(token)
  if (expirationTime) {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000)
    if (expirationTime < oneHourFromNow) {
      return signToken(user)
    }
  }
  
  return null
}