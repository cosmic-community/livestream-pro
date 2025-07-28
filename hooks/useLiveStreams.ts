'use client'

import { useState, useEffect, useCallback } from 'react'
import { LiveStream, LiveStreamFilters, QueryOptions } from '@/lib/cms-types'
import { cosmicRead } from '@/lib/cosmic'

interface UseLiveStreamsReturn {
  streams: LiveStream[]
  isLoading: boolean
  error: string | null
  refreshStreams: () => Promise<void>
  getLiveStreams: () => LiveStream[]
  getFeaturedStreams: () => LiveStream[]
  getStreamsByCategory: (categorySlug: string) => LiveStream[]
  getStreamBySlug: (slug: string) => LiveStream | undefined
  total: number
}

export function useLiveStreams(
  filters: LiveStreamFilters = {},
  options: QueryOptions = {}
): UseLiveStreamsReturn {
  const [streams, setStreams] = useState<LiveStream[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchStreams = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      let query: any = { type: 'live-streams' }

      // Apply filters
      if (filters.status) {
        query['metadata.stream_status.key'] = filters.status
      }

      if (filters.category) {
        query['metadata.category'] = filters.category
      }

      if (filters.streamer) {
        query['metadata.streamer'] = filters.streamer
      }

      if (filters.is_featured !== undefined) {
        query['metadata.is_featured'] = filters.is_featured
      }

      const response = await cosmicRead.objects
        .find(query)
        .props(options.props || ['id', 'title', 'slug', 'metadata'])
        .depth(options.depth || 1)
        .limit(options.limit || 50)
        .skip(options.skip || 0)
        .sort(options.sort || '-created_at')

      if (response.objects) {
        setStreams(response.objects as LiveStream[])
        setTotal(response.objects.length)
      } else {
        setStreams([])
        setTotal(0)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch live streams'
      setError(errorMessage)
      console.error('Error fetching live streams:', err)
      
      // If it's a 404 error, set empty array instead of error
      if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
        setStreams([])
        setTotal(0)
        setError(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [filters, options])

  const refreshStreams = useCallback(async (): Promise<void> => {
    await fetchStreams()
  }, [fetchStreams])

  const getLiveStreams = useCallback((): LiveStream[] => {
    return streams.filter(stream => stream.metadata.stream_status.key === 'live')
  }, [streams])

  const getFeaturedStreams = useCallback((): LiveStream[] => {
    return streams.filter(stream => stream.metadata.is_featured)
  }, [streams])

  const getStreamsByCategory = useCallback((categorySlug: string): LiveStream[] => {
    return streams.filter(stream => 
      stream.metadata.category && stream.metadata.category.slug === categorySlug
    )
  }, [streams])

  const getStreamBySlug = useCallback((slug: string): LiveStream | undefined => {
    return streams.find(stream => stream.slug === slug)
  }, [streams])

  // Initial fetch
  useEffect(() => {
    fetchStreams()
  }, [fetchStreams])

  return {
    streams,
    isLoading,
    error,
    refreshStreams,
    getLiveStreams,
    getFeaturedStreams,
    getStreamsByCategory,
    getStreamBySlug,
    total
  }
}

// Hook for fetching a single live stream
export function useLiveStream(slug: string) {
  const [stream, setStream] = useState<LiveStream | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStream = async () => {
      if (!slug) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await cosmicRead.objects
          .findOne({ type: 'live-streams', slug })
          .props(['id', 'title', 'slug', 'metadata'])
          .depth(1)

        if (response.object) {
          setStream(response.object as LiveStream)
        } else {
          setStream(null)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch live stream'
        setError(errorMessage)
        console.error('Error fetching live stream:', err)
        
        // If it's a 404 error, set null instead of error
        if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
          setStream(null)
          setError(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchStream()
  }, [slug])

  return {
    stream,
    isLoading,
    error
  }
}

// Hook for live stream statistics
export function useStreamStats(streamId?: string) {
  const [stats, setStats] = useState({
    totalStreams: 0,
    liveStreams: 0,
    totalViewers: 0,
    topCategory: null as string | null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await cosmicRead.objects
          .find({ type: 'live-streams' })
          .props(['id', 'metadata'])
          .depth(1)
          .limit(100)

        if (response.objects) {
          const streams = response.objects as LiveStream[]
          const liveStreams = streams.filter(s => s.metadata.stream_status.key === 'live')
          const totalViewers = liveStreams.reduce((sum, s) => sum + (s.metadata.viewer_count || 0), 0)
          
          // Find most popular category
          const categoryCount: Record<string, number> = {}
          streams.forEach(stream => {
            if (stream.metadata.category?.metadata?.name) {
              const categoryName = stream.metadata.category.metadata.name
              categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1
            }
          })
          
          const categoryNames = Object.keys(categoryCount)
          const topCategory = categoryNames.length > 0 
            ? categoryNames.reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b)
            : null

          setStats({
            totalStreams: streams.length,
            liveStreams: liveStreams.length,
            totalViewers,
            topCategory
          })
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stream stats'
        setError(errorMessage)
        console.error('Error fetching stream stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    
    return () => clearInterval(interval)
  }, [streamId])

  return {
    stats,
    isLoading,
    error
  }
}