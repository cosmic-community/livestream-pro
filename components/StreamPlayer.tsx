'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, AlertCircle } from 'lucide-react'
import { StreamPlayerProps } from '@/types'
import { streamManager } from '@/lib/streaming'

export default function StreamPlayer({ 
  streamId, 
  isStreamer
}: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewerCount, setViewerCount] = useState(0)

  useEffect(() => {
    if (isStreamer) {
      // For streamer, show local stream preview
      setupStreamerPreview()
    } else {
      // For viewers, connect to streamer's stream
      connectToStream()
    }

    return () => {
      // Cleanup
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [isStreamer, streamId])

  const setupStreamerPreview = async () => {
    try {
      setIsLoading(true)
      
      // Get local stream for preview
      const localStream = streamManager.getLocalStream()
      if (localStream && videoRef.current) {
        videoRef.current.srcObject = localStream
        setIsConnected(true)
      }
    } catch (error) {
      console.error('Failed to setup streamer preview:', error)
      setError('Failed to access camera/microphone')
    } finally {
      setIsLoading(false)
    }
  }

  const connectToStream = async () => {
    if (!streamId) {
      setError('No active stream')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Connect to streamer's peer
      const remoteStream = await streamManager.connectToStream(streamId)
      
      if (remoteStream && videoRef.current) {
        videoRef.current.srcObject = remoteStream
        setIsConnected(true)
        // Handle viewer count updates internally
        setViewerCount(prev => prev + 1)
      } else {
        setError('Failed to connect to stream')
      }
    } catch (error) {
      console.error('Failed to connect to stream:', error)
      setError('Stream unavailable')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetryConnection = () => {
    setError(null)
    if (isStreamer) {
      setupStreamerPreview()
    } else {
      connectToStream()
    }
  }

  return (
    <div className="video-container">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="video-element"
        autoPlay
        playsInline
        muted={isStreamer} // Mute local preview to avoid feedback
        controls={false}
      />

      {/* Overlay Content */}
      <div className="stream-overlay">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>{isStreamer ? 'Setting up preview...' : 'Connecting to stream...'}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white max-w-md px-4">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
              <p className="text-sm text-gray-300 mb-4">{error}</p>
              <button
                onClick={handleRetryConnection}
                className="control-button control-button-primary px-4 py-2"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Offline State for Viewers */}
        {!isStreamer && !streamId && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <Play className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Stream Offline</h3>
              <p className="text-gray-300">The stream is currently offline. Check back later!</p>
            </div>
          </div>
        )}

        {/* Stream Info Overlay */}
        {isConnected && !error && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between">
              {/* Status Indicator */}
              <div className="status-indicator status-live">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse-red"></div>
                <span>LIVE</span>
              </div>

              {/* Quality Indicator */}
              <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                HD
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}