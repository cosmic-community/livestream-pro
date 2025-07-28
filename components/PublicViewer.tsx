'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Users, Clock } from 'lucide-react'
import { StreamSession, SiteSettings } from '@/types'

interface PublicViewerProps {
  session: StreamSession
  siteSettings: SiteSettings | null
}

export default function PublicViewer({ session, siteSettings }: PublicViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [viewerCount, setViewerCount] = useState(session.metadata.viewer_count)
  const [streamDuration, setStreamDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Simulate stream connection and viewer tracking
  useEffect(() => {
    if (session.metadata.status === 'live') {
      setConnectionStatus('connecting')
      
      // Simulate connection delay
      const connectTimer = setTimeout(() => {
        setConnectionStatus('connected')
        setIsPlaying(true)
      }, 2000)

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
        clearTimeout(connectTimer)
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
    } else {
      setConnectionStatus('disconnected')
      setIsPlaying(false)
    }
  }, [session.id, session.metadata.status, session.metadata.started_at])

  // Handle video controls
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      if (newVolume === 0) {
        setIsMuted(true)
      } else if (isMuted) {
        setIsMuted(false)
      }
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

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

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400'
      case 'connecting': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected'
      case 'connecting': return 'Connecting...'
      case 'error': return 'Connection Error'
      default: return 'Disconnected'
    }
  }

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
        {/* Loading/Connection State */}
        {connectionStatus === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white text-lg">Connecting to stream...</p>
              <p className="text-gray-400 text-sm mt-2">Please wait while we establish connection</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {(connectionStatus === 'error' || error) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="text-center p-6">
              <div className="text-red-400 text-4xl mb-4">⚠️</div>
              <p className="text-white text-lg mb-2">Connection Error</p>
              <p className="text-gray-400 text-sm">{error || 'Unable to connect to stream'}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Offline State */}
        {session.metadata.status !== 'live' && connectionStatus === 'disconnected' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center p-6">
              <div className="text-gray-400 text-6xl mb-4">📺</div>
              <p className="text-white text-xl mb-2">Stream Offline</p>
              <p className="text-gray-400 text-sm">
                {session.metadata.status === 'ended' ? 'This stream has ended' :
                 session.metadata.status === 'scheduled' ? 'Stream is scheduled for later' :
                 'The streamer is currently offline'}
              </p>
              {session.metadata.status === 'scheduled' && session.metadata.start_time && (
                <p className="text-blue-400 text-sm mt-2">
                  Scheduled for: {new Date(session.metadata.start_time).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          style={{ display: connectionStatus === 'connected' ? 'block' : 'none' }}
          onError={() => setError('Video playback error')}
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
            <div className={`px-3 py-1 bg-black/70 rounded-full ${getStatusColor()}`}>
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>
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

        {/* Video Controls */}
        {connectionStatus === 'connected' && (
          <div className="absolute bottom-4 left-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between bg-black/70 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayPause}
                  className="p-2 text-white hover:text-blue-400 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={toggleMute}
                  className="p-2 text-white hover:text-blue-400 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
              
              <button
                onClick={toggleFullscreen}
                className="p-2 text-white hover:text-blue-400 transition-colors"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stream Quality Info */}
      {connectionStatus === 'connected' && (
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Quality:</span>
                <span className="text-foreground font-medium capitalize">
                  {session.metadata.quality || 'Auto'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Type:</span>
                <span className="text-foreground font-medium capitalize">
                  {session.metadata.stream_type || 'Mixed'}
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
      )}
    </div>
  )
}