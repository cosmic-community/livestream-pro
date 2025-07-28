'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import StreamPlayer from '@/components/StreamPlayer'
import StreamControls from '@/components/StreamControls'
import ViewerCount from '@/components/ViewerCount'
import StreamStatus from '@/components/StreamStatus'
import StreamAnalytics from '@/components/StreamAnalytics'
import { StreamConfig, StreamStats, StreamSession } from '@/types'
import { streamManager } from '@/lib/streaming'

export default function StreamerPage() {
  const streamPlayerRef = useRef<any>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentSession, setCurrentSession] = useState<StreamSession | null>(null)
  const [streamStats, setStreamStats] = useState<StreamStats>({
    isLive: false,
    viewerCount: 0,
    duration: 0,
    bitrate: 0,
    quality: 'auto',
  })
  const [streamConfig, setStreamConfig] = useState<StreamConfig>({
    video: true,
    audio: true,
    screen: false,
    quality: 'auto',
  })

  // Update stream stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const stats = streamManager.getStreamStats()
      setStreamStats(stats)
      setIsStreaming(stats.isLive)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleStartStream = async () => {
    try {
      setIsStreaming(true)
      
      // Create stream session in Cosmic FIRST - this makes it appear on watch page
      const response = await fetch('/api/stream/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Live Stream - ${new Date().toLocaleString()}`,
          streamType: streamConfig.screen && streamConfig.video ? 'both' : 
                     streamConfig.screen ? 'screen' : 'webcam',
          quality: streamConfig.quality,
        }),
      })

      const data = await response.json()
      if (data.success && data.data) {
        setCurrentSession(data.data)
        
        // Set session ID in stream manager for consistent peer identification
        streamManager.setSessionId(data.data.id)
        
        console.log('✅ Stream session created and is now LIVE on watch page:', data.data)
        
        // Show success message
        const watchUrl = `${window.location.origin}/watch/${data.data.id}`
        console.log('🔗 Public watch URL:', watchUrl)
      }

      // Start the actual WebRTC stream using the StreamPlayer
      if (streamPlayerRef.current) {
        await streamPlayerRef.current.startStream(streamConfig)
      }
    } catch (error) {
      console.error('Failed to start stream:', error)
      setIsStreaming(false)
      alert('Failed to start stream. Please check your camera and microphone permissions.')
    }
  }

  const handleStopStream = async () => {
    try {
      // Stop the actual stream
      if (streamPlayerRef.current) {
        streamPlayerRef.current.stopStream()
      }
      
      setIsStreaming(false)
      
      // End stream session in Cosmic
      if (currentSession) {
        await fetch('/api/stream/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: currentSession.id,
            viewerCount: streamStats.viewerCount,
            duration: streamStats.duration,
          }),
        })
        
        console.log('✅ Stream session ended and removed from watch page')
        setCurrentSession(null)
      }
    } catch (error) {
      console.error('Failed to stop stream:', error)
    }
  }

  const handleConfigChange = (config: StreamConfig) => {
    setStreamConfig(config)
  }

  const handleViewerCountChange = (count: number) => {
    setStreamStats((prev: StreamStats) => ({
      ...prev,
      viewerCount: count,
    }))
  }

  // Get public stream URL
  const getPublicStreamUrl = () => {
    if (currentSession) {
      return `${window.location.origin}/watch/${currentSession.id}`
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="text-xl font-bold text-foreground hover:text-blue-400 transition-colors"
              >
                ← LiveStream Pro
              </Link>
              <div className="text-muted-foreground">|</div>
              <h1 className="text-xl font-semibold text-foreground">Streamer Dashboard</h1>
              <StreamStatus 
                status={isStreaming ? 'live' : 'offline'} 
                duration={streamStats.duration} 
              />
            </div>
            <ViewerCount 
              count={streamStats.viewerCount}
              isLive={isStreaming}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Preview and Controls */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Video Preview */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <StreamPlayer 
                  ref={streamPlayerRef}
                  streamId={currentSession?.id}
                  isStreamer={true}
                  activeSession={currentSession}
                  onViewerCountChange={handleViewerCountChange}
                />
              </div>

              {/* Stream Controls */}
              <StreamControls
                isStreaming={isStreaming}
                streamConfig={streamConfig}
                onStartStream={handleStartStream}
                onStopStream={handleStopStream}
                onConfigChange={handleConfigChange}
                streamPlayerRef={streamPlayerRef}
              />
            </div>
          </div>

          {/* Sidebar - Analytics and Stats */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Current Stream Stats */}
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-4">Live Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-medium ${isStreaming ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {isStreaming ? 'Live' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Viewers</span>
                    <span className="font-medium text-foreground">{streamStats.viewerCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quality</span>
                    <span className="font-medium text-foreground capitalize">{streamStats.quality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium text-foreground">
                      {Math.floor(streamStats.duration / 60)}:{(streamStats.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stream Session Info */}
              {currentSession && (
                <div className="bg-muted/30 rounded-lg p-6">
                  <h3 className="font-semibold text-foreground mb-4">Current Session</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Session ID:</span>
                      <span className="font-mono text-foreground ml-2 text-xs">
                        {currentSession.id.slice(-8)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Started:</span>
                      <span className="text-foreground ml-2">
                        {new Date(currentSession.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    {isStreaming && getPublicStreamUrl() && (
                      <div className="mt-3">
                        <span className="text-muted-foreground block mb-1">Public URL:</span>
                        <a
                          href={getPublicStreamUrl()!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs font-mono break-all underline"
                        >
                          {getPublicStreamUrl()}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Live Status Alert */}
              {isStreaming && currentSession && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-green-600 dark:text-green-400 text-xl">🔴</div>
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                        You're Live!
                      </h4>
                      <p className="text-green-700 dark:text-green-300 text-sm">
                        Your stream is now visible on the watch page. Viewers can find you at{' '}
                        <a
                          href="/watch"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-medium"
                        >
                          /watch
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {isStreaming && getPublicStreamUrl() ? (
                    <a
                      href={getPublicStreamUrl()!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg font-medium transition-colors"
                    >
                      View Public Stream
                    </a>
                  ) : (
                    <Link
                      href="/watch"
                      className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg font-medium transition-colors"
                    >
                      View All Streams
                    </Link>
                  )}
                  <button
                    onClick={() => window.location.reload()}
                    className="block w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-center rounded-lg font-medium transition-colors"
                  >
                    Refresh Dashboard
                  </button>
                </div>
              </div>

              {/* Stream Analytics */}
              <StreamAnalytics />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}