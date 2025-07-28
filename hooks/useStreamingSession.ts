'use client'

import { useState, useEffect, useCallback } from 'react'
import { StreamSession, StreamConfig, ApiResponse } from '@/types'

interface UseStreamingSessionReturn {
  session: StreamSession | null
  isLoading: boolean
  error: string | null
  createSession: (title: string, config: StreamConfig) => Promise<StreamSession | null>
  updateSession: (sessionId: string, updates: Partial<StreamSession['metadata']>) => Promise<void>
  endSession: (sessionId: string) => Promise<void>
  refreshSession: (sessionId: string) => Promise<void>
}

export function useStreamingSession(): UseStreamingSessionReturn {
  const [session, setSession] = useState<StreamSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createSession = useCallback(async (
    title: string, 
    config: StreamConfig
  ): Promise<StreamSession | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stream/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          streamType: config.screen && config.video ? 'both' : 
                     config.screen ? 'screen' : 'webcam',
          quality: config.quality,
        }),
      })

      const data: ApiResponse<StreamSession> = await response.json()

      if (data.success && data.data) {
        setSession(data.data)
        return data.data
      } else {
        throw new Error(data.error || 'Failed to create stream session')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateSession = useCallback(async (
    sessionId: string,
    updates: Partial<StreamSession['metadata']>
  ): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stream/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          ...updates
        }),
      })

      const data: ApiResponse<StreamSession> = await response.json()

      if (data.success && data.data) {
        setSession(data.data)
      } else {
        throw new Error(data.error || 'Failed to update stream session')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update session'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const endSession = useCallback(async (sessionId: string): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stream/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          viewerCount: session?.metadata.viewer_count || 0,
          duration: session?.metadata.duration || 0,
        }),
      })

      const data: ApiResponse<StreamSession> = await response.json()

      if (data.success && data.data) {
        setSession(data.data)
      } else {
        throw new Error(data.error || 'Failed to end stream session')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end session'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [session])

  const refreshSession = useCallback(async (sessionId: string): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/stream/status?sessionId=${sessionId}`)
      const data: ApiResponse<StreamSession> = await response.json()

      if (data.success && data.data) {
        setSession(prev => prev ? { ...prev, ...data.data } : data.data as StreamSession)
      } else {
        throw new Error(data.error || 'Failed to refresh stream session')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh session'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    session,
    isLoading,
    error,
    createSession,
    updateSession,
    endSession,
    refreshSession
  }
}

// Hook for managing session state during streaming
export function useStreamingState(sessionId?: string) {
  const [isLive, setIsLive] = useState(false)
  const [duration, setDuration] = useState(0)
  const [viewerCount, setViewerCount] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)

  // Update duration when streaming is live
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isLive && startTime) {
      interval = setInterval(() => {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
        setDuration(elapsed)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isLive, startTime])

  // Sync with session data
  useEffect(() => {
    if (!sessionId) return

    const syncWithSession = async () => {
      try {
        const response = await fetch(`/api/stream/status?sessionId=${sessionId}`)
        const data = await response.json()

        if (data.success && data.data) {
          const sessionData = data.data
          setIsLive(sessionData.status === 'live')
          setViewerCount(sessionData.viewer_count || 0)
          
          if (sessionData.started_at) {
            setStartTime(new Date(sessionData.started_at))
          }
        }
      } catch (error) {
        console.error('Failed to sync with session:', error)
      }
    }

    syncWithSession()
    const interval = setInterval(syncWithSession, 5000)

    return () => clearInterval(interval)
  }, [sessionId])

  const startStreaming = useCallback(() => {
    setIsLive(true)
    setStartTime(new Date())
    setDuration(0)
  }, [])

  const stopStreaming = useCallback(() => {
    setIsLive(false)
    setStartTime(null)
  }, [])

  const updateViewerCount = useCallback((count: number) => {
    setViewerCount(count)
  }, [])

  return {
    isLive,
    duration,
    viewerCount,
    startTime,
    startStreaming,
    stopStreaming,
    updateViewerCount,
    setDuration,
    setViewerCount
  }
}

// Hook for session analytics and metrics
export function useSessionAnalytics(sessionId?: string) {
  const [analytics, setAnalytics] = useState({
    totalViewers: 0,
    peakViewers: 0,
    averageWatchTime: 0,
    totalWatchTime: 0,
    chatMessages: 0,
    engagement: 0
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    if (!sessionId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/analytics?sessionId=${sessionId}`)
      const data = await response.json()

      if (data.success && data.data) {
        setAnalytics(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch analytics')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const trackEvent = useCallback(async (event: string, data?: any) => {
    if (!sessionId) return

    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          event,
          data,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }, [sessionId])

  return {
    analytics,
    isLoading,
    error,
    fetchAnalytics,
    trackEvent
  }
}