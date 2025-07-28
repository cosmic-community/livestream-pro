'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Eye, Clock, Globe } from 'lucide-react'

interface AnalyticsData {
  totalViews: number
  totalHours: number
  averageViewers: number
  topCountries: Array<{ country: string; viewers: number }>
}

export default function StreamAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-muted/30 rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-4">Analytics</h3>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="bg-muted/30 rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-4">Analytics</h3>
        <p className="text-muted-foreground text-sm">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="bg-muted/30 rounded-lg p-6">
      <h3 className="font-semibold text-foreground mb-4">Analytics</h3>
      
      <div className="space-y-4">
        {/* Total Views */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">Total Views</span>
          </div>
          <span className="font-semibold text-foreground">
            {analytics.totalViews.toLocaleString()}
          </span>
        </div>

        {/* Total Hours */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">Total Hours</span>
          </div>
          <span className="font-semibold text-foreground">
            {Math.round(analytics.totalHours)}h
          </span>
        </div>

        {/* Average Viewers */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">Avg Viewers</span>
          </div>
          <span className="font-semibold text-foreground">
            {Math.round(analytics.averageViewers)}
          </span>
        </div>

        {/* Top Countries */}
        {analytics.topCountries.length > 0 && (
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Top Countries</span>
            </div>
            <div className="space-y-2">
              {analytics.topCountries.slice(0, 3).map((country, index) => (
                <div key={country.country} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">
                    #{index + 1} {country.country}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {country.viewers} viewers
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}