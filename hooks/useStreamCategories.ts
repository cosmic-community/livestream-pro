'use client'

import { useState, useEffect, useCallback } from 'react'
import { StreamCategory, StreamCategoryFilters, QueryOptions } from '@/lib/cms-types'
import { cosmicRead } from '@/lib/cosmic'

interface UseStreamCategoriesReturn {
  categories: StreamCategory[]
  isLoading: boolean
  error: string | null
  refreshCategories: () => Promise<void>
  getActiveCategories: () => StreamCategory[]
  getCategoryBySlug: (slug: string) => StreamCategory | undefined
  total: number
}

export function useStreamCategories(
  filters: StreamCategoryFilters = {},
  options: QueryOptions = {}
): UseStreamCategoriesReturn {
  const [categories, setCategories] = useState<StreamCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchCategories = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      let query: any = { type: 'stream-categories' }

      // Apply filters
      if (filters.is_active !== undefined) {
        query['metadata.is_active'] = filters.is_active
      }

      const response = await cosmicRead.objects
        .find(query)
        .props(options.props || ['id', 'title', 'slug', 'metadata'])
        .depth(options.depth || 1)
        .limit(options.limit || 50)
        .skip(options.skip || 0)
        .sort(options.sort || 'title')

      if (response.objects) {
        setCategories(response.objects as StreamCategory[])
        setTotal(response.objects.length)
      } else {
        setCategories([])
        setTotal(0)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stream categories'
      setError(errorMessage)
      console.error('Error fetching stream categories:', err)
      
      // If it's a 404 error, set empty array instead of error
      if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
        setCategories([])
        setTotal(0)
        setError(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [filters, options])

  const refreshCategories = useCallback(async (): Promise<void> => {
    await fetchCategories()
  }, [fetchCategories])

  const getActiveCategories = useCallback((): StreamCategory[] => {
    return categories.filter(category => category.metadata.is_active)
  }, [categories])

  const getCategoryBySlug = useCallback((slug: string): StreamCategory | undefined => {
    return categories.find(category => category.slug === slug)
  }, [categories])

  // Initial fetch
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    categories,
    isLoading,
    error,
    refreshCategories,
    getActiveCategories,
    getCategoryBySlug,
    total
  }
}

// Hook for fetching a single stream category
export function useStreamCategory(slug: string) {
  const [category, setCategory] = useState<StreamCategory | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategory = async () => {
      if (!slug) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await cosmicRead.objects
          .findOne({ type: 'stream-categories', slug })
          .props(['id', 'title', 'slug', 'metadata'])
          .depth(1)

        if (response.object) {
          setCategory(response.object as StreamCategory)
        } else {
          setCategory(null)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stream category'
        setError(errorMessage)
        console.error('Error fetching stream category:', err)
        
        // If it's a 404 error, set null instead of error
        if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
          setCategory(null)
          setError(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategory()
  }, [slug])

  return {
    category,
    isLoading,
    error
  }
}