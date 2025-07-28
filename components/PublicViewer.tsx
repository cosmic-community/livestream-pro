'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Users, Clock, AlertCircle } from 'lucide-react'
import { StreamSession, SiteSettings } from '@/types'
import StreamPlayer from '@/components/StreamPlayer'

interface PublicViewerProps {
  session: StreamSession
  siteSettings: SiteSettings | null
}

export default function PublicViewer({ session, siteSettings }: PublicViewerProps) {
  const [viewerCount, setViewerCount] = useState(session.metadata.viewer_count)
  const [streamDuration, setStreamDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Update viewer count and stream duration
  useEffect(() => {
    if (session.metadata.status === 'live') {
      // Join stream (increment viewer count)
      fetch('/api/stream/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: session.id,
          action: 'join'
        })
      }).then(response => response.json())
        .then(data => {
          if (data.success) {
            setViewerCount(data.data.viewerCount)
          }
        })
        .catch(err => console.error('Error joining stream:', err))

      // Send heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        fetch('/api/stream/public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streamId: session.id,
            action: 'heartbeat'
          })
        }).catch(err => console.error('Heartbeat error:', err))
      }, 30000)

      // Update stream duration
      const durationInterval = setInterval(() => {
        if (session.metadata.started_at) {
          const startTime = new Date(session.metadata.started_at).getTime()
          const now = Date.now()
          setStreamDuration(Math.floor((now - startTime) / 1000))
        }
      }, 1000)

      return () => {
        clearInterval(heartbeatInterval)
        clearInterval(durationInterval)
        
        // Leave stream (decrement viewer count)
        fetch('/api/stream/public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streamId: session.id,
            action: 'leave'
          })
        }).catch(err => console.error('Error leaving stream:', err))
      }
    }
  }, [session.id, session.metadata.status, session.metadata.started_at])

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const retryConnection = () => {
    setError(null)
    // Force component re-render by updating a state
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      {/* Main Video Player */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
        <StreamPlayer
          streamId={session.id}
          isStreamer={false}
          activeSession={session}
          className="w-full h-full"
        />

        {/* Stream Status Overlay */}
        <div className="absolute top-4 left-4 z-20">
          <div className="flex items-center gap-3">
            {session.metadata.status === 'live' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">LIVE</span>
              </div>
            )}
          </div>
        </div>

        {/* Viewer Count and Duration */}
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-black/70 rounded-full">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">
                {viewerCount.toLocaleString()}
              </span>
            </div>
            {session.metadata.status === 'live' && streamDuration > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-black/70 rounded-full">
                <Clock className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">
                  {formatDuration(streamDuration)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error State Overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
            <div className="text-center p-6">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-white text-lg mb-2">Connection Error</p>
              <p className="text-gray-400 text-sm mb-4">{error}</p>
              <button
                onClick={retryConnection}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stream Quality Info */}
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Quality:</span>
              <span className="text-foreground font-medium capitalize">
                {session.metadata.quality || 'Auto'}
              </span>
            </div>
            {session.metadata.stream_type && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Type:</span>
                <span className="text-foreground font-medium capitalize">
                  {session.metadata.stream_type}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status:</span>
              <span className={`font-medium capitalize ${
                session.metadata.status === 'live' ? 'text-red-400' :
                session.metadata.status === 'ended' ? 'text-gray-400' :
                session.metadata.status === 'scheduled' ? 'text-blue-400' :
                'text-muted-foreground'
              }`}>
                {session.metadata.status}
              </span>
            </div>
          </div>
          
          <div className="text-muted-foreground">
            {session.metadata.platform && (
              <span className="capitalize">{session.metadata.platform}</span>
            )}
          </div>
        </div>
      </div>

      {/* Stream Instructions for Viewers */}
      {session.metadata.status === 'live' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 dark:text-blue-400 text-xl">💡</div>
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                Watching Live Stream
              </h4>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                You're watching a live stream! The video shows what the streamer is currently broadcasting, 
                including their webcam and screen share if enabled. Video controls are available in the player.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Offline Stream Message */}
      {session.metadata.status !== 'live' && (
        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-gray-600 dark:text-gray-400 text-xl">📺</div>
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                Stream {session.metadata.status === 'ended' ? 'Ended' : 'Offline'}
              </h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                {session.metadata.status === 'ended' 
                  ? 'This stream has ended. Check back later for new streams!'
                  : session.metadata.status === 'scheduled'
                  ? 'This stream is scheduled for later. Check back at the scheduled time.'
                  : 'The streamer is currently offline. Check back later for live content!'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}