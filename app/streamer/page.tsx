'use client'

import { useState, useEffect } from 'react'
import StreamPlayer from '@/components/StreamPlayer'
import StreamControls from '@/components/StreamControls'
import ViewerCount from '@/components/ViewerCount'
import StreamStatus from '@/components/StreamStatus'
import StreamAnalytics from '@/components/StreamAnalytics'
import { StreamConfig, StreamStats } from '@/types'
import { streamManager } from '@/lib/streaming'

export default function StreamerPage() {
  const [isStreaming, setIsStreaming] = useState(false)
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
      await streamManager.startStream(streamConfig)
      setIsStreaming(true)
      
      // Create stream session in Cosmic
      await fetch('/api/stream/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Live Stream - ${new Date().toLocaleString()}`,
          streamType: streamConfig.screen && streamConfig.video ? 'both' : 
                     streamConfig.screen ? 'screen' : 'webcam',
          quality: streamConfig.quality,
        }),
      })
    } catch (error) {
      console.error('Failed to start stream:', error)
      alert('Failed to start stream. Please check your camera and microphone permissions.')
    }
  }

  const handleStopStream = async () => {
    try {
      streamManager.stopStream()
      setIsStreaming(false)
      
      // End stream session in Cosmic
      await fetch('/api/stream/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewerCount: streamStats.viewerCount,
          duration: streamStats.duration,
        }),
      })
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-foreground">Streamer Dashboard</h1>
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
                  isStreamer={true}
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
                    <span className="text-muted-foreground">Bitrate</span>
                    <span className="font-medium text-foreground">
                      {Math.round(streamStats.bitrate / 1000)}k
                    </span>
                  </div>
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