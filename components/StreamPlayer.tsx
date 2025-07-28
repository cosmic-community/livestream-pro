'use client'

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { StreamPlayerProps, StreamConfig } from '@/types'
import { streamManager } from '@/lib/streaming'

export interface StreamPlayerMethods {
  startStream: (config: { video: boolean; audio: boolean; screen?: boolean }) => Promise<void>
  stopStream: () => void
  getLocalStream: () => MediaStream | null
  isStreamActive: () => boolean
}

const StreamPlayer = forwardRef<StreamPlayerMethods, StreamPlayerProps>(({
  streamId,
  isStreamer = false,
  className = '',
  onViewerCountChange,
  activeSession
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamActive, setStreamActive] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')

  // Initialize stream manager for streamers
  useEffect(() => {
    if (isStreamer) {
      // Set session ID if available
      if (activeSession?.id) {
        streamManager.setSessionId(activeSession.id)
      }
    }
  }, [isStreamer, activeSession])

  // For viewers: connect to remote stream
  useEffect(() => {
    if (!isStreamer && activeSession && activeSession.metadata?.status === 'live') {
      connectToRemoteStream()
    } else if (!isStreamer) {
      setConnectionStatus('disconnected')
      setStreamActive(false)
      setRemoteStream(null)
    }
  }, [isStreamer, activeSession])

  const connectToRemoteStream = async () => {
    if (!activeSession?.id) return

    setIsLoading(true)
    setConnectionStatus('connecting')
    setError(null)

    try {
      // Use session ID as streamer ID
      const streamerId = `streamer-${activeSession.id}`
      console.log('Connecting to streamer:', streamerId)

      const stream = await streamManager.connectToStream(streamerId)
      
      if (stream && stream.getTracks().length > 0) {
        setRemoteStream(stream)
        setConnectionStatus('connected')
        setStreamActive(true)
        setError(null)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          try {
            await videoRef.current.play()
            console.log('Remote stream playback started')
          } catch (playError) {
            console.error('Video play error:', playError)
            setError('Failed to play remote stream')
            setConnectionStatus('error')
          }
        }
      } else {
        throw new Error('No valid stream received from streamer')
      }
    } catch (error) {
      console.error('Failed to connect to remote stream:', error)
      setError(error instanceof Error ? error.message : 'Failed to connect to stream')
      setConnectionStatus('error')
      setStreamActive(false)
    } finally {
      setIsLoading(false)
    }
  }

  const startLocalStream = async (config: { video: boolean; audio: boolean; screen?: boolean }) => {
    if (!isStreamer) return

    try {
      setIsLoading(true)
      setError(null)

      // Use session ID for consistent streamer identification
      const sessionStreamerId = activeSession?.id ? `streamer-${activeSession.id}` : undefined
      
      // Convert the config to StreamConfig by adding the missing quality property
      const streamConfig: StreamConfig = {
        video: config.video,
        audio: config.audio,
        screen: config.screen || false,
        quality: 'auto' // Add the missing quality property with default value
      }
      
      const streamId = await streamManager.startStream(streamConfig)
      console.log('Local stream started with ID:', streamId)

      const stream = streamManager.getLocalStream()
      
      if (stream) {
        setLocalStream(stream)
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.muted = true // Mute local preview to avoid feedback
        }

        setStreamActive(true)
        setError(null)
        
        console.log('Local stream started with tracks:', 
          stream.getTracks().map(track => `${track.kind}: ${track.label || 'unlabeled'}`))
      }

    } catch (error) {
      console.error('Failed to start local stream:', error)
      setError(`Failed to access ${config.screen ? 'screen' : 'camera/microphone'}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const stopLocalStream = () => {
    if (!isStreamer) return

    streamManager.stopStream()
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setLocalStream(null)
    setStreamActive(false)
    console.log('Local stream stopped')
  }

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    startStream: startLocalStream,
    stopStream: stopLocalStream,
    getLocalStream: () => localStream,
    isStreamActive: () => streamActive
  }))

  // Update viewer count periodically for streamers
  useEffect(() => {
    if (isStreamer && onViewerCountChange && streamActive) {
      const interval = setInterval(() => {
        const stats = streamManager.getStreamStats()
        onViewerCountChange(stats.viewerCount)
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [isStreamer, onViewerCountChange, streamActive])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isStreamer) {
        stopLocalStream()
      }
    }
  }, [isStreamer])

  const handleVideoError = () => {
    setError('Video playback error')
    setStreamActive(false)
    setConnectionStatus('error')
  }

  const retryConnection = () => {
    if (!isStreamer && activeSession?.metadata?.status === 'live') {
      setError(null)
      setConnectionStatus('disconnected')
      connectToRemoteStream()
    }
  }

  const getStatusText = () => {
    if (isStreamer) {
      return streamActive ? 'Live Preview' : 'Preview'
    } else {
      switch (connectionStatus) {
        case 'connected': return 'Live Stream'
        case 'connecting': return 'Connecting...'
        case 'error': return 'Connection Error'
        default: return 'Stream Offline'
      }
    }
  }

  const getStatusColor = () => {
    if (isStreamer) {
      return streamActive ? 'text-red-400' : 'text-gray-400'
    } else {
      switch (connectionStatus) {
        case 'connected': return 'text-red-400'
        case 'connecting': return 'text-yellow-400'
        case 'error': return 'text-red-400'
        default: return 'text-gray-400'
      }
    }
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-white text-sm">
              {isStreamer ? 'Starting stream...' : 'Connecting to stream...'}
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center p-6">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <p className="text-white text-lg mb-2">
              {isStreamer ? 'Stream Error' : 'Connection Error'}
            </p>
            <p className="text-gray-400 text-sm mb-4">{error}</p>
            {!isStreamer && (
              <button
                onClick={retryConnection}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                Retry Connection
              </button>
            )}
          </div>
        </div>
      )}

      {/* No Stream State */}
      {!streamActive && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center p-6">
            <div className="text-gray-400 text-6xl mb-4">📹</div>
            <p className="text-white text-lg mb-2">{getStatusText()}</p>
            <p className="text-gray-400 text-sm">
              {isStreamer 
                ? 'Configure your stream settings and click "Start Stream"' 
                : activeSession?.metadata?.status === 'live' 
                  ? 'Attempting to connect to stream...'
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
        controls={!isStreamer && streamActive} // Show controls for viewers
        onError={handleVideoError}
        className="w-full h-full object-cover"
        style={{ display: streamActive ? 'block' : 'none' }}
      />

      {/* Stream Status Overlay */}
      {streamActive && (
        <div className="absolute top-4 left-4 z-20">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/70 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className={`text-xs font-medium ${getStatusColor()}`}>
              {getStatusText().toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Stream Info Overlay for Streamers */}
      {isStreamer && streamActive && localStream && (
        <div className="absolute bottom-4 left-4 z-20">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/70 rounded-full">
            <span className="text-white text-xs">
              {localStream.getVideoTracks().length}V / {localStream.getAudioTracks().length}A
            </span>
          </div>
        </div>
      )}

      {/* Connection Status for Viewers */}
      {!isStreamer && (
        <div className="absolute bottom-4 right-4 z-20">
          <div className={`px-3 py-1 bg-black/70 rounded-full ${getStatusColor()}`}>
            <span className="text-xs font-medium">{connectionStatus.toUpperCase()}</span>
          </div>
        </div>
      )}
    </div>
  )
})

StreamPlayer.displayName = 'StreamPlayer'

export default StreamPlayer