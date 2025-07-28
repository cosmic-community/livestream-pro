'use client'

import { useState, useEffect, useRef } from 'react'
import { StreamConfig } from '@/types'
import { streamManager } from '@/lib/streaming'

interface StreamControlsProps {
  isStreaming?: boolean
  streamConfig?: StreamConfig
  onStartStream?: () => Promise<void>
  onStopStream?: () => Promise<void>
  onConfigChange?: (config: StreamConfig) => void
  viewerMode?: boolean
  streamPlayerRef?: React.RefObject<any>
}

export default function StreamControls({
  isStreaming = false,
  streamConfig = {
    video: true,
    audio: true,
    screen: false,
    quality: 'auto'
  },
  onStartStream,
  onStopStream,
  onConfigChange,
  viewerMode = false,
  streamPlayerRef
}: StreamControlsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localStreamConfig, setLocalStreamConfig] = useState<StreamConfig>(streamConfig)

  // Update local config when props change
  useEffect(() => {
    setLocalStreamConfig(streamConfig)
  }, [streamConfig])

  // If in viewer mode, show minimal controls or stream info
  if (viewerMode) {
    return (
      <div className="bg-muted/30 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="font-medium text-foreground">
              {isStreaming ? 'Stream is Live' : 'Stream is Offline'}
            </span>
          </div>
          {isStreaming && (
            <div className="text-sm text-muted-foreground">
              Quality: {streamConfig.quality}
            </div>
          )}
        </div>
      </div>
    )
  }

  const handleStartStream = async () => {
    if (!onStartStream && !streamPlayerRef?.current?.startStream) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      if (streamPlayerRef?.current?.startStream) {
        // Use stream player's start method directly
        await streamPlayerRef.current.startStream(localStreamConfig)
      } else if (onStartStream) {
        // Fallback to callback method
        await onStartStream()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start stream')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopStream = async () => {
    if (!onStopStream && !streamPlayerRef?.current?.stopStream) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      if (streamPlayerRef?.current?.stopStream) {
        // Use stream player's stop method directly
        streamPlayerRef.current.stopStream()
      } else if (onStopStream) {
        // Fallback to callback method
        await onStopStream()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop stream')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfigChange = (key: keyof StreamConfig, value: any) => {
    const newConfig = { ...localStreamConfig, [key]: value }
    setLocalStreamConfig(newConfig)
    
    if (onConfigChange) {
      onConfigChange(newConfig)
    }

    // If stream is active, update it with new configuration
    if (isStreaming && streamPlayerRef?.current?.isStreamActive?.()) {
      updateStreamingConfig(newConfig)
    }
  }

  const updateStreamingConfig = async (config: StreamConfig) => {
    try {
      // For live configuration updates, restart the stream with new settings
      if (streamPlayerRef?.current) {
        await streamPlayerRef.current.stopStream()
        await new Promise(resolve => setTimeout(resolve, 500)) // Brief pause
        await streamPlayerRef.current.startStream(config)
      }
    } catch (error) {
      console.error('Failed to update stream configuration:', error)
      setError('Failed to update stream settings')
    }
  }

  return (
    <div className="space-y-6">
      {/* Stream Status */}
      <div className="bg-muted/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Stream Controls</h3>
          <div className={`w-3 h-3 rounded-full ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-300 hover:text-red-100 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex gap-3">
          {!isStreaming ? (
            <button
              onClick={handleStartStream}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Starting...' : 'Start Stream'}
            </button>
          ) : (
            <button
              onClick={handleStopStream}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Stopping...' : 'Stop Stream'}
            </button>
          )}
        </div>
      </div>

      {/* Stream Configuration */}
      <div className="bg-muted/30 rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-4">Configuration</h3>
        
        <div className="space-y-4">
          {/* Video Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Video</label>
            <button
              onClick={() => handleConfigChange('video', !localStreamConfig.video)}
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                localStreamConfig.video ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localStreamConfig.video ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Audio Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Audio</label>
            <button
              onClick={() => handleConfigChange('audio', !localStreamConfig.audio)}
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                localStreamConfig.audio ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localStreamConfig.audio ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Screen Share Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Screen Share</label>
            <button
              onClick={() => handleConfigChange('screen', !localStreamConfig.screen)}
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                localStreamConfig.screen ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localStreamConfig.screen ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Quality Selection */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Quality</label>
            <select
              value={localStreamConfig.quality}
              onChange={(e) => handleConfigChange('quality', e.target.value as StreamConfig['quality'])}
              disabled={isLoading}
              className="px-3 py-1 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="auto">Auto</option>
              <option value="low">Low (480p)</option>
              <option value="medium">Medium (720p)</option>
              <option value="high">High (1080p)</option>
            </select>
          </div>
        </div>

        {/* Configuration Info */}
        {isStreaming && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200 text-xs">
              💡 Changes to configuration will restart your stream briefly to apply new settings.
            </p>
          </div>
        )}
      </div>

      {/* Stream Statistics */}
      {isStreaming && (
        <div className="bg-muted/30 rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-4">Live Statistics</h3>
          <StreamStats />
        </div>
      )}
    </div>
  )
}

// Live stream statistics component
function StreamStats() {
  const [stats, setStats] = useState({
    isLive: false,
    viewerCount: 0,
    duration: 0,
    bitrate: 0,
    quality: 'auto'
  })

  useEffect(() => {
    const updateStats = () => {
      const currentStats = streamManager.getStreamStats()
      setStats(currentStats)
    }

    updateStats() // Initial update
    const interval = setInterval(updateStats, 2000)
    
    return () => clearInterval(interval)
  }, [])

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-muted-foreground text-sm">Status</span>
        <span className={`font-medium text-sm ${stats.isLive ? 'text-red-400' : 'text-muted-foreground'}`}>
          {stats.isLive ? 'Live' : 'Offline'}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground text-sm">Viewers</span>
        <span className="font-medium text-foreground text-sm">{stats.viewerCount}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground text-sm">Duration</span>
        <span className="font-medium text-foreground text-sm">{formatDuration(stats.duration)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground text-sm">Quality</span>
        <span className="font-medium text-foreground text-sm capitalize">{stats.quality}</span>
      </div>
    </div>
  )
}