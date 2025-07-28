'use client'

import { useState, useEffect, useRef } from 'react'
import { Monitor, MonitorOff, Square, Volume2, VolumeX } from 'lucide-react'

interface ScreenShareProps {
  isEnabled: boolean
  onStreamChange: (stream: MediaStream | null) => void
  onToggle: () => void
}

export default function ScreenShare({
  isEnabled,
  onStreamChange,
  onToggle
}: ScreenShareProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)

  // Start/stop screen sharing
  useEffect(() => {
    const startScreenShare = async () => {
      if (!isEnabled) {
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
          setStream(null)
          onStreamChange(null)
          setIsSharing(false)
        }
        return
      }

      try {
        // Check if getDisplayMedia is supported
        if (!navigator.mediaDevices?.getDisplayMedia) {
          throw new Error('Screen sharing is not supported in this browser')
        }

        const constraints: DisplayMediaStreamConstraints = {
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        }

        const screenStream = await navigator.mediaDevices.getDisplayMedia(constraints)
        
        // Handle when user stops sharing via browser UI
        const videoTrack = screenStream.getVideoTracks()[0]
        if (videoTrack) {
          videoTrack.addEventListener('ended', () => {
            console.log('Screen sharing ended by user')
            setIsSharing(false)
            setStream(null)
            onStreamChange(null)
            onToggle() // This will set isEnabled to false
          })
        }
        
        // Set video element source
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream
          // Ensure video plays
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(console.error)
          }
        }
        
        setStream(screenStream)
        onStreamChange(screenStream)
        setIsSharing(true)
        setError(null)
        
        console.log('Screen sharing started successfully')
      } catch (err) {
        console.error('Failed to start screen share:', err)
        const error = err as Error
        
        let errorMessage = 'Failed to start screen sharing'
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Screen sharing permission denied'
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Screen sharing is not supported in this browser'
        } else if (error.name === 'AbortError') {
          errorMessage = 'Screen sharing was cancelled'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        setError(errorMessage)
        setIsSharing(false)
        onStreamChange(null)
      }
    }

    startScreenShare()
  }, [isEnabled, onStreamChange, onToggle])

  const toggleAudio = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length > 0) {
        const newAudioEnabled = !audioEnabled
        audioTracks.forEach(track => {
          track.enabled = newAudioEnabled
        })
        setAudioEnabled(newAudioEnabled)
      }
    }
  }

  const stopSharing = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop()
        console.log('Stopped track:', track.kind)
      })
      setStream(null)
      onStreamChange(null)
      setIsSharing(false)
    }
    onToggle()
  }

  return (
    <div className="space-y-4">
      {/* Screen Share Preview */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {isSharing ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            
            {/* Status Overlay */}
            <div className="absolute top-2 left-2">
              <div className="flex items-center gap-2 px-2 py-1 bg-black/70 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-white text-xs">Screen Sharing</span>
              </div>
            </div>

            {/* Audio Status */}
            {stream && stream.getAudioTracks().length > 0 && (
              <div className="absolute bottom-2 right-2">
                <div className={`p-2 rounded-full ${audioEnabled ? 'bg-green-600' : 'bg-red-600'}`}>
                  {audioEnabled ? (
                    <Volume2 className="w-4 h-4 text-white" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>
            )}

            {/* Stop Button Overlay */}
            <div className="absolute bottom-2 left-2">
              <button
                onClick={stopSharing}
                className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-medium transition-colors"
              >
                <Square className="w-3 h-3 fill-current" />
                Stop Sharing
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MonitorOff className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Screen Sharing Disabled</p>
              {error && (
                <p className="text-red-400 text-xs mt-1">{error}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isSharing
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          {isSharing ? 'Stop Sharing' : 'Share Screen'}
        </button>

        {isSharing && stream && stream.getAudioTracks().length > 0 && (
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-lg transition-colors ${
              audioEnabled
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={audioEnabled ? 'Mute system audio' : 'Unmute system audio'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Info */}
      {!isSharing && !error && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-blue-800 dark:text-blue-200 text-xs">
            Click "Share Screen" to capture your entire screen, a specific application window, or a browser tab.
            You can include system audio if supported by your browser.
          </p>
        </div>
      )}
    </div>
  )
}