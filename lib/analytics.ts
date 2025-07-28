import { createStreamAnalytics, getStreamAnalytics } from '@/lib/cosmic'
import { StreamAnalytics } from '@/types'

export interface AnalyticsEvent {
  sessionId: string
  event: string
  data?: any
  timestamp: string
  userId?: string
  userAgent?: string
  ipAddress?: string
}

export interface SessionMetrics {
  sessionId: string
  totalViewers: number
  peakViewers: number
  averageWatchTime: number
  totalWatchTime: number
  bounceRate: number
  engagement: number
  qualityMetrics?: {
    bitrate: number
    fps: number
    droppedFrames: number
    resolution: string
  }
  geographicData?: {
    countries: Record<string, number>
    cities: Record<string, number>
  }
  deviceData?: {
    browsers: Record<string, number>
    os: Record<string, number>
    devices: Record<string, number>
  }
  trafficSources?: {
    direct: number
    social: number
    search: number
    referral: number
  }
}

class AnalyticsService {
  private events: AnalyticsEvent[] = []
  private sessionMetrics: Map<string, SessionMetrics> = new Map()

  // Track an analytics event
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      this.events.push(event)

      // Create analytics record in Cosmic
      await createStreamAnalytics({
        type: 'stream-analytics',
        title: `${event.event} - ${event.sessionId}`,
        slug: `analytics-${event.sessionId}-${Date.now()}`,
        metadata: {
          session_id: event.sessionId,
          timestamp: event.timestamp,
          viewer_count: 0, // This would be updated based on the event
          duration: 0, // This would be calculated
          platform: 'web',
          quality_metrics: {
            bitrate: 0,
            fps: 0,
            dropped_frames: 0
          },
          engagement_metrics: {
            chat_messages: 0,
            reactions: 0,
            shares: 0
          }
        }
      })

      console.log('Analytics event tracked:', event)
    } catch (error) {
      console.error('Failed to track analytics event:', error)
    }
  }

  // Track viewer join
  async trackViewerJoin(sessionId: string, userId?: string): Promise<void> {
    await this.trackEvent({
      sessionId,
      event: 'viewer_join',
      timestamp: new Date().toISOString(),
      userId,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined
    })

    this.updateSessionMetrics(sessionId, (metrics) => ({
      ...metrics,
      totalViewers: metrics.totalViewers + 1
    }))
  }

  // Track viewer leave
  async trackViewerLeave(sessionId: string, watchTime: number, userId?: string): Promise<void> {
    await this.trackEvent({
      sessionId,
      event: 'viewer_leave',
      data: { watchTime },
      timestamp: new Date().toISOString(),
      userId
    })

    this.updateSessionMetrics(sessionId, (metrics) => ({
      ...metrics,
      totalWatchTime: metrics.totalWatchTime + watchTime,
      averageWatchTime: metrics.totalWatchTime / metrics.totalViewers
    }))
  }

  // Track quality change
  async trackQualityChange(
    sessionId: string, 
    oldQuality: string, 
    newQuality: string
  ): Promise<void> {
    await this.trackEvent({
      sessionId,
      event: 'quality_change',
      data: { oldQuality, newQuality },
      timestamp: new Date().toISOString()
    })
  }

  // Track chat message
  async trackChatMessage(sessionId: string, messageLength: number): Promise<void> {
    await this.trackEvent({
      sessionId,
      event: 'chat_message',
      data: { messageLength },
      timestamp: new Date().toISOString()
    })

    this.updateSessionMetrics(sessionId, (metrics) => ({
      ...metrics,
      engagement: metrics.engagement + 1
    }))
  }

  // Track stream start
  async trackStreamStart(sessionId: string, config: any): Promise<void> {
    await this.trackEvent({
      sessionId,
      event: 'stream_start',
      data: config,
      timestamp: new Date().toISOString()
    })

    // Initialize session metrics
    this.sessionMetrics.set(sessionId, {
      sessionId,
      totalViewers: 0,
      peakViewers: 0,
      averageWatchTime: 0,
      totalWatchTime: 0,
      bounceRate: 0,
      engagement: 0
    })
  }

  // Track stream end
  async trackStreamEnd(sessionId: string, duration: number): Promise<void> {
    await this.trackEvent({
      sessionId,
      event: 'stream_end',
      data: { duration },
      timestamp: new Date().toISOString()
    })
  }

  // Track error
  async trackError(sessionId: string, error: string, errorType: string): Promise<void> {
    await this.trackEvent({
      sessionId,
      event: 'error',
      data: { error, errorType },
      timestamp: new Date().toISOString()
    })
  }

  // Update session metrics
  private updateSessionMetrics(
    sessionId: string, 
    updater: (metrics: SessionMetrics) => SessionMetrics
  ): void {
    const currentMetrics = this.sessionMetrics.get(sessionId)
    if (currentMetrics) {
      const updatedMetrics = updater(currentMetrics)
      this.sessionMetrics.set(sessionId, updatedMetrics)
    }
  }

  // Get session metrics
  getSessionMetrics(sessionId: string): SessionMetrics | null {
    return this.sessionMetrics.get(sessionId) || null
  }

  // Get analytics data from Cosmic
  async getAnalytics(
    sessionId?: string,
    timeRange?: '24h' | '7d' | '30d'
  ): Promise<StreamAnalytics[]> {
    try {
      return await getStreamAnalytics(sessionId, timeRange)
    } catch (error) {
      console.error('Failed to get analytics:', error)
      return []
    }
  }

  // Calculate engagement rate
  calculateEngagementRate(sessionId: string): number {
    const metrics = this.sessionMetrics.get(sessionId)
    if (!metrics || metrics.totalViewers === 0) return 0

    return (metrics.engagement / metrics.totalViewers) * 100
  }

  // Calculate bounce rate
  calculateBounceRate(sessionId: string, minWatchTime: number = 30): number {
    const events = this.events.filter(e => 
      e.sessionId === sessionId && e.event === 'viewer_leave'
    )

    const quickLeaves = events.filter(e =>
      e.data && e.data.watchTime < minWatchTime
    ).length

    return events.length > 0 ? (quickLeaves / events.length) * 100 : 0
  }

  // Get viewer retention curve
  getRetentionCurve(sessionId: string): Array<{ time: number; viewers: number }> {
    const joinEvents = this.events.filter(e => 
      e.sessionId === sessionId && e.event === 'viewer_join'
    ).map(e => ({ time: new Date(e.timestamp).getTime(), change: 1 }))

    const leaveEvents = this.events.filter(e => 
      e.sessionId === sessionId && e.event === 'viewer_leave'
    ).map(e => ({ time: new Date(e.timestamp).getTime(), change: -1 }))

    const allEvents = [...joinEvents, ...leaveEvents]
      .sort((a, b) => a.time - b.time)

    let currentViewers = 0
    const curve: Array<{ time: number; viewers: number }> = []

    allEvents.forEach(event => {
      currentViewers += event.change
      curve.push({ time: event.time, viewers: Math.max(0, currentViewers) })
    })

    return curve
  }

  // Export analytics data
  exportAnalytics(sessionId: string): string {
    const metrics = this.sessionMetrics.get(sessionId)
    const events = this.events.filter(e => e.sessionId === sessionId)

    const exportData = {
      sessionId,
      metrics,
      events,
      retentionCurve: this.getRetentionCurve(sessionId),
      generatedAt: new Date().toISOString()
    }

    return JSON.stringify(exportData, null, 2)
  }

  // Clear old data (cleanup)
  clearOldData(olderThanDays: number = 30): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    this.events = this.events.filter(event => 
      new Date(event.timestamp) > cutoffDate
    )

    // Clear old session metrics (you might want to persist important ones)
    const sessionsToKeep = new Set(
      this.events.map(event => event.sessionId)
    )

    this.sessionMetrics.forEach((_, sessionId) => {
      if (!sessionsToKeep.has(sessionId)) {
        this.sessionMetrics.delete(sessionId)
      }
    })
  }
}

// Singleton instance
export const analytics = new AnalyticsService()

// Utility functions for common analytics operations
export const analyticsUtils = {
  // Track page view
  trackPageView: (page: string, sessionId?: string) => {
    if (sessionId) {
      analytics.trackEvent({
        sessionId,
        event: 'page_view',
        data: { page },
        timestamp: new Date().toISOString()
      })
    }
  },

  // Track user interaction
  trackInteraction: (sessionId: string, interaction: string, element?: string) => {
    analytics.trackEvent({
      sessionId,
      event: 'user_interaction',
      data: { interaction, element },
      timestamp: new Date().toISOString()
    })
  },

  // Track performance metrics
  trackPerformance: (sessionId: string, metrics: any) => {
    analytics.trackEvent({
      sessionId,
      event: 'performance',
      data: metrics,
      timestamp: new Date().toISOString()
    })
  },

  // Get browser info
  getBrowserInfo: () => {
    if (typeof window === 'undefined') return null

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    }
  },

  // Get device info
  getDeviceInfo: () => {
    if (typeof window === 'undefined') return null

    return {
      screenWidth: screen.width,
      screenHeight: screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window
    }
  }
}