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
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [peer, setPeer] = useState<any>(null)

  useEffect(() => {
    if (isStreamer) {
      // For streamer: Initialize peer and prepare for broadcasting
      initializeStreamerPeer()
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

  const initializeStreamerPeer = async () => {
    if (typeof window !== 'undefined') {
      try {
        const { Peer } = await import('peerjs')
        const streamerId = `streamer-${streamId}`
        
        const newPeer = new Peer(streamerId, {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ]
          }
        })

        newPeer.on('open', (id: string) => {
          console.log('Streamer peer connection opened:', id)
        })

        newPeer.on('call', (call: any) => {
          console.log('Incoming call from viewer:', call.peer)
          // Answer with current stream
          if (localStream) {
            call.answer(localStream)
            console.log('Answered call with stream containing tracks:', 
              localStream.getTracks().map(track => `${track.kind}: ${track.label || 'unlabeled'}`))
          } else {
            console.warn('No local stream available to answer call')
            // Answer with empty stream to maintain connection
            call.answer(new MediaStream())
          }
        })

        newPeer.on('error', (err: any) => {
          console.error('Streamer peer error:', err)
          setError('Peer connection error')
        })

        setPeer(newPeer)

      } catch (error) {
        console.error('Failed to initialize streamer peer:', error)
        setError('Failed to initialize streaming')
      }
    }
  }

  const startLocalStream = async (config: { video: boolean; audio: boolean; screen?: boolean }) => {
    try {
      setIsLoading(true)
      setError(null)

      let stream: MediaStream | null = null

      if (config.screen) {
        // Get screen share stream
        if (navigator.mediaDevices?.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 }
            },
            audio: true
          })

          // If also capturing webcam, combine streams
          if (config.video || config.audio) {
            try {
              const webcamStream = await navigator.mediaDevices.getUserMedia({
                video: config.video ? {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  frameRate: { ideal: 30 }
                } : false,
                audio: config.audio ? {
                  echoCancellation: true,
                  noiseSuppression: true
                } : false
              })

              // Create combined stream
              const combinedStream = new MediaStream()
              
              // Add screen video (primary)
              screenStream.getVideoTracks().forEach(track => {
                combinedStream.addTrack(track)
              })
              
              // Add audio (prefer screen audio, fallback to webcam)
              const screenAudioTracks = screenStream.getAudioTracks()
              if (screenAudioTracks.length > 0) {
                screenAudioTracks.forEach(track => {
                  combinedStream.addTrack(track)
                })
              } else {
                webcamStream.getAudioTracks().forEach(track => {
                  combinedStream.addTrack(track)
                })
              }

              stream = combinedStream

              // Clean up individual streams
              screenStream.getTracks().forEach(track => {
                if (!combinedStream.getTracks().includes(track)) {
                  track.stop()
                }
              })
              webcamStream.getTracks().forEach(track => {
                if (!combinedStream.getTracks().includes(track)) {
                  track.stop()
                }
              })

            } catch (webcamError) {
              console.warn('Failed to get webcam stream, using screen only:', webcamError)
              stream = screenStream
            }
          } else {
            stream = screenStream
          }

          // Handle screen share end
          const videoTrack = stream.getVideoTracks()[0]
          if (videoTrack) {
            videoTrack.addEventListener('ended', () => {
              console.log('Screen sharing ended by user')
              stopLocalStream()
            })
          }

        } else {
          throw new Error('Screen sharing is not supported in this browser')
        }
      } else {
        // Get webcam/audio only
        stream = await navigator.mediaDevices.getUserMedia({
          video: config.video ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          } : false,
          audio: config.audio ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } : false
        })
      }

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
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop()
        console.log('Stopped track:', track.kind, track.label)
      })
      setLocalStream(null)
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setStreamActive(false)
  }

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocalStream()
      if (peer) {
        peer.destroy()
      }
    }
  }, [])

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

      {/* Stream Info Overlay */}
      {isStreamer && streamActive && localStream && (
        <div className="absolute bottom-4 left-4 z-20">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/70 rounded-full">
            <span className="text-white text-xs">
              {localStream.getVideoTracks().length}V / {localStream.getAudioTracks().length}A
            </span>
          </div>
        </div>
      )}

      {/* Expose methods for parent components */}
      {isStreamer && (
        <div className="hidden">
          <button
            ref={(btn) => {
              if (btn && !btn.dataset.methodsAttached) {
                btn.dataset.methodsAttached = 'true'
                // Attach methods to parent component via ref callback
                const parent = btn.closest('[data-stream-player]')
                if (parent) {
                  (parent as any).startStream = startLocalStream
                  (parent as any).stopStream = stopLocalStream
                  (parent as any).getLocalStream = () => localStream
                  (parent as any).isStreamActive = () => streamActive
                }
              }
            }}
          />
        </div>
      )}
    </div>
  )
}