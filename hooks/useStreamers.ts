'use client'

import { useState, useEffect, useCallback } from 'react'
import { Streamer, StreamerFilters, QueryOptions } from '@/lib/cms-types'
import { cosmicRead } from '@/lib/cosmic'

interface UseStreamersReturn {
  streamers: Streamer[]
  isLoading: boolean
  error: string | null
  refreshStreamers: () => Promise<void>
  getLiveStreamers: () => Streamer[]
  getStreamerBySlug: (slug: string) => Streamer | undefined
  total: number
}

export function useStreamers(
  filters: StreamerFilters = {},
  options: QueryOptions = {}
): UseStreamersReturn {
  const [streamers, setStreamers] = useState<Streamer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchStreamers = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      let query: any = { type: 'streamers' }

      // Apply filters
      if (filters.is_live !== undefined) {
        query['metadata.is_live'] = filters.is_live
      }

      if (filters.account_status) {
        query['metadata.account_status.key'] = filters.account_status
      }

      const response = await cosmicRead.objects
        .find(query)
        .props(options.props || ['id', 'title', 'slug', 'metadata'])
        .depth(options.depth || 1)
        .limit(options.limit || 50)
        .skip(options.skip || 0)
        .sort(options.sort || '-created_at')

      if (response.objects) {
        setStreamers(response.objects as Streamer[])
        setTotal(response.objects.length)
      } else {
        setStreamers([])
        setTotal(0)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch streamers'
      setError(errorMessage)
      console.error('Error fetching streamers:', err)
      
      // If it's a 404 error, set empty array instead of error
      if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
        setStreamers([])
        setTotal(0)
        setError(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [filters, options])

  const refreshStreamers = useCallback(async (): Promise<void> => {
    await fetchStreamers()
  }, [fetchStreamers])

  const getLiveStreamers = useCallback((): Streamer[] => {
    return streamers.filter(streamer => streamer.metadata.is_live)
  }, [streamers])

  const getStreamerBySlug = useCallback((slug: string): Streamer | undefined => {
    return streamers.find(streamer => streamer.slug === slug)
  }, [streamers])

  // Initial fetch
  useEffect(() => {
    fetchStreamers()
  }, [fetchStreamers])

  return {
    streamers,
    isLoading,
    error,
    refreshStreamers,
    getLiveStreamers,
    getStreamerBySlug,
    total
  }
}

// Hook for fetching a single streamer
export function useStreamer(slug: string) {
  const [streamer, setStreamer] = useState<Streamer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStreamer = async () => {
      if (!slug) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await cosmicRead.objects
          .findOne({ type: 'streamers', slug })
          .props(['id', 'title', 'slug', 'metadata'])
          .depth(1)

        if (response.object) {
          setStreamer(response.object as Streamer)
        } else {
          setStreamer(null)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch streamer'
        setError(errorMessage)
        console.error('Error fetching streamer:', err)
        
        // If it's a 404 error, set null instead of error
        if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
          setStreamer(null)
          setError(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchStreamer()
  }, [slug])

  return {
    streamer,
    isLoading,
    error
  }
}

// Hook for fetching streamers with search
export function useStreamerSearch() {
  const [searchResults, setSearchResults] = useState<Streamer[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const searchStreamers = useCallback(async (searchTerm: string): Promise<void> => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setSearchError(null)

    try {
      // Note: This is a simplified search. Cosmic doesn't have built-in full-text search
      // In production, you might want to use a dedicated search service
      const response = await cosmicRead.objects
        .find({ type: 'streamers' })
        .props(['id', 'title', 'slug', 'metadata'])
        .depth(1)
        .limit(20)

      if (response.objects) {
        // Filter results that contain the search term
        const filtered = response.objects.filter((streamer: any) => 
          streamer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          streamer.metadata.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (streamer.metadata.bio && streamer.metadata.bio.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        
        setSearchResults(filtered as Streamer[])
      } else {
        setSearchResults([])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setSearchError(errorMessage)
      console.error('Error searching streamers:', err)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const clearSearch = useCallback(() => {
    setSearchResults([])
    setSearchError(null)
  }, [])

  return {
    searchResults,
    isSearching,
    searchError,
    searchStreamers,
    clearSearch
  }
}