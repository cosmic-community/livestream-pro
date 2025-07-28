'use client'

import { useEffect, useState } from 'react'
import { Calendar, Clock, Users, Play } from 'lucide-react'
import { StreamSession, StreamHistoryProps } from '@/types'

export default function StreamHistory({ limit = 5 }: StreamHistoryProps) {
  const [sessions, setSessions] = useState<StreamSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStreamHistory()
  }, [])

  const fetchStreamHistory = async () => {
    try {
      const response = await fetch('/api/stream/history')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Failed to fetch stream history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <Play className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No recent streams</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sessions.slice(0, limit).map((session) => (
        <div 
          key={session.id} 
          className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors"
        >
          {/* Session Title */}
          <h4 className="font-medium text-foreground mb-2 truncate">
            {session.title}
          </h4>

          {/* Session Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(session.created_at)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{session.metadata?.peak_viewers || 0} peak</span>
            </div>

            {session.metadata?.duration && (
              <div className="flex items-center gap-1 col-span-2">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(session.metadata.duration)}</span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              session.metadata?.status === 'live' 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-muted text-muted-foreground'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                session.metadata?.status === 'live' ? 'bg-red-400' : 'bg-muted-foreground'
              }`}></div>
              {session.metadata?.status || 'offline'}
            </span>
          </div>
        </div>
      ))}

      {/* View All Link */}
      {sessions.length > limit && (
        <button className="w-full text-center text-sm text-primary hover:text-primary/80 py-2">
          View all streams
        </button>
      )}
    </div>
  )
}