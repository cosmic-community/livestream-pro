'use client'

import { useState, useEffect } from 'react'
import { StreamConfig, StreamControlsProps } from '@/types'

// Make props optional for viewer mode
interface OptionalStreamControlsProps {
  isStreaming?: boolean
  streamConfig?: StreamConfig
  onStartStream?: () => Promise<void>
  onStopStream?: () => Promise<void>
  onConfigChange?: (config: StreamConfig) => void
  viewerMode?: boolean
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
  viewerMode = false
}: OptionalStreamControlsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (!onStartStream) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      await onStartStream()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start stream')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopStream = async () => {
    if (!onStopStream) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      await onStopStream()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop stream')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfigChange = (key: keyof StreamConfig, value: any) => {
    if (!onConfigChange) return
    
    const newConfig = { ...streamConfig, [key]: value }
    onConfigChange(newConfig)
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
              onClick={() => handleConfigChange('video', !streamConfig.video)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                streamConfig.video ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  streamConfig.video ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Audio Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Audio</label>
            <button
              onClick={() => handleConfigChange('audio', !streamConfig.audio)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                streamConfig.audio ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  streamConfig.audio ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Screen Share Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Screen Share</label>
            <button
              onClick={() => handleConfigChange('screen', !streamConfig.screen)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                streamConfig.screen ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  streamConfig.screen ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Quality Selection */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Quality</label>
            <select
              value={streamConfig.quality}
              onChange={(e) => handleConfigChange('quality', e.target.value as StreamConfig['quality'])}
              className="px-3 py-1 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="auto">Auto</option>
              <option value="low">Low (480p)</option>
              <option value="medium">Medium (720p)</option>
              <option value="high">High (1080p)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}