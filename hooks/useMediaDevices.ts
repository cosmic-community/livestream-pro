'use client'

import { useState, useEffect, useCallback } from 'react'

interface MediaDevice {
  deviceId: string
  label: string
  kind: MediaDeviceKind
}

interface UseMediaDevicesReturn {
  videoDevices: MediaDevice[]
  audioDevices: MediaDevice[]
  outputDevices: MediaDevice[]
  isLoading: boolean
  error: string | null
  refreshDevices: () => Promise<void>
  hasPermissions: boolean
  requestPermissions: () => Promise<boolean>
}

export function useMediaDevices(): UseMediaDevicesReturn {
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([])
  const [outputDevices, setOutputDevices] = useState<MediaDevice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasPermissions, setHasPermissions] = useState(false)

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      // Stop the stream immediately as we only needed it for permissions
      stream.getTracks().forEach(track => track.stop())
      
      setHasPermissions(true)
      setError(null)
      return true
    } catch (err) {
      console.error('Permission denied:', err)
      setError('Camera and microphone permissions are required')
      setHasPermissions(false)
      return false
    }
  }, [])

  const refreshDevices = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)

      const devices = await navigator.mediaDevices.enumerateDevices()
      
      const videoInputs: MediaDevice[] = []
      const audioInputs: MediaDevice[] = []
      const audioOutputs: MediaDevice[] = []

      devices.forEach(device => {
        const mediaDevice: MediaDevice = {
          deviceId: device.deviceId,
          label: device.label || `${device.kind} ${device.deviceId.slice(0, 8)}`,
          kind: device.kind
        }

        switch (device.kind) {
          case 'videoinput':
            videoInputs.push(mediaDevice)
            break
          case 'audioinput':
            audioInputs.push(mediaDevice)
            break
          case 'audiooutput':
            audioOutputs.push(mediaDevice)
            break
        }
      })

      setVideoDevices(videoInputs)
      setAudioDevices(audioInputs)
      setOutputDevices(audioOutputs)

      // Check if we have permissions (devices will have labels if we do)
      const hasLabels = devices.some(device => device.label !== '')
      setHasPermissions(hasLabels)

    } catch (err) {
      console.error('Error enumerating devices:', err)
      setError('Failed to get media devices')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial device enumeration
  useEffect(() => {
    refreshDevices()
  }, [refreshDevices])

  // Listen for device changes
  useEffect(() => {
    const handleDeviceChange = () => {
      refreshDevices()
    }

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
    }
  }, [refreshDevices])

  return {
    videoDevices,
    audioDevices,
    outputDevices,
    isLoading,
    error,
    refreshDevices,
    hasPermissions,
    requestPermissions
  }
}

// Hook for managing media streams
interface UseMediaStreamOptions {
  video?: boolean | MediaTrackConstraints
  audio?: boolean | MediaTrackConstraints
  onStreamChange?: (stream: MediaStream | null) => void
}

interface UseMediaStreamReturn {
  stream: MediaStream | null
  isActive: boolean
  error: string | null
  startStream: () => Promise<void>
  stopStream: () => void
  toggleVideo: () => Promise<void>
  toggleAudio: () => void
  switchCamera: (deviceId: string) => Promise<void>
  switchMicrophone: (deviceId: string) => Promise<void>
}

export function useMediaStream(options: UseMediaStreamOptions = {}): UseMediaStreamReturn {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { video = true, audio = true, onStreamChange } = options

  const startStream = useCallback(async (): Promise<void> => {
    try {
      setError(null)
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video,
        audio
      })

      setStream(mediaStream)
      setIsActive(true)
      
      if (onStreamChange) {
        onStreamChange(mediaStream)
      }

      // Handle track ended events
      mediaStream.getTracks().forEach(track => {
        track.addEventListener('ended', () => {
          setIsActive(false)
          setStream(null)
          if (onStreamChange) {
            onStreamChange(null)
          }
        })
      })

    } catch (err) {
      console.error('Error starting media stream:', err)
      setError('Failed to start camera/microphone')
      setIsActive(false)
    }
  }, [video, audio, onStreamChange])

  const stopStream = useCallback((): void => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setIsActive(false)
      
      if (onStreamChange) {
        onStreamChange(null)
      }
    }
  }, [stream, onStreamChange])

  const toggleVideo = useCallback(async (): Promise<void> => {
    if (!stream) return

    const videoTrack = stream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
    }
  }, [stream])

  const toggleAudio = useCallback((): void => {
    if (!stream) return

    const audioTrack = stream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
    }
  }, [stream])

  const switchCamera = useCallback(async (deviceId: string): Promise<void> => {
    if (!stream) return

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: stream.getAudioTracks().length > 0
      })

      // Replace video track
      const videoTrack = newStream.getVideoTracks()[0]
      const sender = stream.getVideoTracks()[0]
      
      if (videoTrack && sender) {
        // Stop old track
        sender.stop()
        
        // Add new track to stream
        stream.removeTrack(sender)
        stream.addTrack(videoTrack)
        
        setStream(new MediaStream(stream.getTracks()))
        
        if (onStreamChange) {
          onStreamChange(stream)
        }
      }
    } catch (err) {
      console.error('Error switching camera:', err)
      setError('Failed to switch camera')
    }
  }, [stream, onStreamChange])

  const switchMicrophone = useCallback(async (deviceId: string): Promise<void> => {
    if (!stream) return

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: stream.getVideoTracks().length > 0,
        audio: { deviceId: { exact: deviceId } }
      })

      // Replace audio track
      const audioTrack = newStream.getAudioTracks()[0]
      const sender = stream.getAudioTracks()[0]
      
      if (audioTrack && sender) {
        // Stop old track
        sender.stop()
        
        // Add new track to stream
        stream.removeTrack(sender)
        stream.addTrack(audioTrack)
        
        setStream(new MediaStream(stream.getTracks()))
        
        if (onStreamChange) {
          onStreamChange(stream)
        }
      }
    } catch (err) {
      console.error('Error switching microphone:', err)
      setError('Failed to switch microphone')
    }
  }, [stream, onStreamChange])

  // Cleanup on unmount
  useEffect(() => {
    return stopStream
  }, [stopStream])

  return {
    stream,
    isActive,
    error,
    startStream,
    stopStream,
    toggleVideo,
    toggleAudio,
    switchCamera,
    switchMicrophone
  }
}