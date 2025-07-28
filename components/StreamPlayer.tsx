'use client'

import { useState, useEffect, useRef } from 'react'
import { StreamPlayerProps } from '@/types'
import { streamManager } from '@/lib/streaming'

export default function StreamPlayer({
  streamId,
  isStreamer = false,
  className = '',
  onViewerCountChange
}: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamActive, setStreamActive] = useState(false)

  useEffect(() => {
    if (isStreamer) {
      // For streamer: show local stream preview
      const updatePreview = () => {
        const localStream = streamManager.getLocalStream()
        if (videoRef.current && localStream) {
          videoRef.current.srcObject = localStream
          setStreamActive(true)
          setError(null)
        }
      }

      // Update preview every second
      const interval = setInterval(updatePreview, 1000)
      updatePreview() // Initial update

      return () => clearInterval(interval)
    } else if (streamId) {
      // For viewer: connect to remote stream
      setIsLoading(true)
      
      streamManager.connectToStream(streamId)
        .then((remoteStream) => {
          if (videoRef.current && remoteStream) {
            videoRef.current.srcObject = remoteStream
            setStreamActive(true)
            setError(null)
          }
        })
        .catch((err) => {
          setError('Failed to connect to stream')
          console.error('Stream connection error:', err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isStreamer, streamId])

  // Update viewer count periodically for streamers
  useEffect(() => {
    if (isStreamer && onViewerCountChange) {
      const interval = setInterval(() => {
        const stats = streamManager.getStreamStats()
        onViewerCountChange(stats.viewerCount)
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [isStreamer, onViewerCountChange])

  const handleVideoError = () => {
    setError('Video playback error')
    setStreamActive(false)
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-white text-sm">Connecting to stream...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center p-6">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <p className="text-white text-lg mb-2">Stream Error</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* No Stream State */}
      {!streamActive && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center p-6">
            <div className="text-gray-400 text-6xl mb-4">📹</div>
            <p className="text-white text-lg mb-2">
              {isStreamer ? 'Stream Preview' : 'Stream Offline'}
            </p>
            <p className="text-gray-400 text-sm">
              {isStreamer 
                ? 'Configure your stream settings and click "Start Stream"' 
                : 'The streamer is currently offline'
              }
            </p>
          </div>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isStreamer} // Mute local preview to avoid feedback
        controls={!isStreamer} // Show controls for viewers
        onError={handleVideoError}
        className="w-full h-full object-cover"
        style={{ display: streamActive ? 'block' : 'none' }}
      />

      {/* Stream Status Overlay */}
      {streamActive && (
        <div className="absolute top-4 left-4 z-20">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/70 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white text-xs font-medium">
              {isStreamer ? 'LIVE PREVIEW' : 'LIVE'}
            </span>
          </div>
        </div>
      )}

      {/* Streamer Controls Overlay */}
      {isStreamer && streamActive && (
        <div className="absolute bottom-4 right-4 z-20">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/70 rounded-full">
            <span className="text-white text-xs">
              Preview Mode
            </span>
          </div>
        </div>
      )}
    </div>
  )
}