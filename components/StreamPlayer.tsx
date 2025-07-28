'use client'

import { useState, useEffect, useRef } from 'react'
import { StreamPlayerProps } from '@/types'

export default function StreamPlayer({
  streamId,
  isStreamer = false,
  className = '',
  onViewerCountChange,
  activeSession
}: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamActive, setStreamActive] = useState(false)

  useEffect(() => {
    if (isStreamer) {
      // For streamer: show local stream preview
      const updatePreview = async () => {
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ 
              video: true, 
              audio: true 
            })
            if (videoRef.current) {
              videoRef.current.srcObject = stream
              setStreamActive(true)
              setError(null)
            }
          }
        } catch (err) {
          console.error('Failed to get user media:', err)
          setError('Unable to access camera/microphone')
        }
      }

      updatePreview()
    } else if (activeSession && activeSession.metadata?.status === 'live') {
      // For viewer: simulate stream connection
      setIsLoading(true)
      
      // Simulate loading delay
      setTimeout(() => {
        setIsLoading(false)
        setStreamActive(true)
        setError(null)
      }, 2000)
    } else {
      setStreamActive(false)
      setError(null)
    }
  }, [isStreamer, activeSession])

  // Update viewer count periodically for streamers
  useEffect(() => {
    if (isStreamer && onViewerCountChange) {
      const interval = setInterval(() => {
        // Simulate viewer count updates
        const viewerCount = Math.floor(Math.random() * 50) + 1
        onViewerCountChange(viewerCount)
      }, 5000)
      
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