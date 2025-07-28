'use client'

import { useState, useEffect, useRef } from 'react'
import { Camera, CameraOff, Mic, MicOff, Settings } from 'lucide-react'

interface WebcamCaptureProps {
  isEnabled: boolean
  onStreamChange: (stream: MediaStream | null) => void
  onToggle: () => void
}

export default function WebcamCapture({
  isEnabled,
  onStreamChange,
  onToggle
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('')
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get available media devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoInputs = devices.filter(device => device.kind === 'videoinput')
        const audioInputs = devices.filter(device => device.kind === 'audioinput')
        
        setVideoDevices(videoInputs)
        setAudioDevices(audioInputs)
        
        // Set default devices
        if (videoInputs.length > 0 && !selectedVideoDevice) {
          setSelectedVideoDevice(videoInputs[0].deviceId)
        }
        if (audioInputs.length > 0 && !selectedAudioDevice) {
          setSelectedAudioDevice(audioInputs[0].deviceId)
        }
      } catch (err) {
        console.error('Failed to get media devices:', err)
        setError('Failed to access media devices')
      }
    }

    getDevices()
  }, [selectedVideoDevice, selectedAudioDevice])

  // Start/stop webcam stream
  useEffect(() => {
    const startWebcam = async () => {
      if (!isEnabled) {
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
          setStream(null)
          onStreamChange(null)
        }
        return
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          },
          audio: audioEnabled ? {
            deviceId: selectedAudioDevice ? { exact: selectedAudioDevice } : undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } : false
        }

        const newStream = await navigator.mediaDevices.getUserMedia(constraints)
        
        if (videoRef.current) {
          videoRef.current.srcObject = newStream
        }
        
        setStream(newStream)
        onStreamChange(newStream)
        setError(null)
      } catch (err) {
        console.error('Failed to start webcam:', err)
        setError('Failed to access camera/microphone')
        onStreamChange(null)
      }
    }

    startWebcam()
  }, [isEnabled, selectedVideoDevice, selectedAudioDevice, audioEnabled, onStreamChange])

  const toggleAudio = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !audioEnabled
      })
    }
    setAudioEnabled(!audioEnabled)
  }

  const handleDeviceChange = async (type: 'video' | 'audio', deviceId: string) => {
    if (type === 'video') {
      setSelectedVideoDevice(deviceId)
    } else {
      setSelectedAudioDevice(deviceId)
    }
  }

  return (
    <div className="space-y-4">
      {/* Webcam Preview */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {isEnabled ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Status Overlay */}
            <div className="absolute top-2 left-2">
              <div className="flex items-center gap-2 px-2 py-1 bg-black/70 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white text-xs">Webcam Active</span>
              </div>
            </div>

            {/* Audio/Video Status */}
            <div className="absolute bottom-2 right-2 flex gap-2">
              <div className={`p-2 rounded-full ${audioEnabled ? 'bg-green-600' : 'bg-red-600'}`}>
                {audioEnabled ? (
                  <Mic className="w-4 h-4 text-white" />
                ) : (
                  <MicOff className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="p-2 rounded-full bg-green-600">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <CameraOff className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Webcam Disabled</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center p-4">
              <p className="text-red-400 text-sm mb-2">Camera Error</p>
              <p className="text-gray-400 text-xs">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isEnabled
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
        >
          {isEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
          {isEnabled ? 'Stop Camera' : 'Start Camera'}
        </button>

        {isEnabled && (
          <>
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-lg transition-colors ${
                audioEnabled
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Device Settings */}
      {showSettings && isEnabled && (
        <div className="bg-muted/30 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-foreground">Device Settings</h4>
          
          {/* Video Device Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Camera</label>
            <select
              value={selectedVideoDevice}
              onChange={(e) => handleDeviceChange('video', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {videoDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Audio Device Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Microphone</label>
            <select
              value={selectedAudioDevice}
              onChange={(e) => handleDeviceChange('audio', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {audioDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}