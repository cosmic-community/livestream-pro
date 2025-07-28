'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { StreamConfig } from '@/types'

interface UseWebRTCOptions {
  config?: RTCConfiguration
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  onRemoteStream?: (stream: MediaStream) => void
  onDataChannelMessage?: (data: any) => void
}

interface UseWebRTCReturn {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  connectionState: RTCPeerConnectionState
  isConnected: boolean
  error: string | null
  createOffer: () => Promise<RTCSessionDescriptionInit | null>
  createAnswer: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit | null>
  setRemoteDescription: (description: RTCSessionDescriptionInit) => Promise<void>
  addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>
  startLocalStream: (config: StreamConfig) => Promise<void>
  stopLocalStream: () => void
  sendData: (data: any) => void
  closeConnection: () => void
}

export function useWebRTC(options: UseWebRTCOptions = {}): UseWebRTCReturn {
  const {
    config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    },
    onConnectionStateChange,
    onRemoteStream,
    onDataChannelMessage
  } = options

  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new')
  const [error, setError] = useState<string | null>(null)

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([])

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current
    }

    const peerConnection = new RTCPeerConnection(config)
    peerConnectionRef.current = peerConnection

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const newState = peerConnection.connectionState
      setConnectionState(newState)
      onConnectionStateChange?.(newState)

      if (newState === 'failed' || newState === 'disconnected') {
        setError('Connection failed or disconnected')
      } else if (newState === 'connected') {
        setError(null)
      }
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, you'd send this to the remote peer via signaling
        console.log('New ICE candidate:', event.candidate)
      }
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams
      if (remoteStream) {
        setRemoteStream(remoteStream)
        onRemoteStream?.(remoteStream)
      }
    }

    // Create data channel
    const dataChannel = peerConnection.createDataChannel('messages')
    dataChannelRef.current = dataChannel

    dataChannel.onopen = () => {
      console.log('Data channel opened')
    }

    dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onDataChannelMessage?.(data)
      } catch (error) {
        console.error('Failed to parse data channel message:', error)
      }
    }

    // Handle incoming data channel
    peerConnection.ondatachannel = (event) => {
      const channel = event.channel
      channel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onDataChannelMessage?.(data)
        } catch (error) {
          console.error('Failed to parse data channel message:', error)
        }
      }
    }

    return peerConnection
  }, [config, onConnectionStateChange, onRemoteStream, onDataChannelMessage])

  const createOffer = useCallback(async (): Promise<RTCSessionDescriptionInit | null> => {
    try {
      const peerConnection = initializePeerConnection()
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })

      await peerConnection.setLocalDescription(offer)
      return offer
    } catch (error) {
      console.error('Failed to create offer:', error)
      setError('Failed to create connection offer')
      return null
    }
  }, [initializePeerConnection])

  const createAnswer = useCallback(async (
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit | null> => {
    try {
      const peerConnection = initializePeerConnection()
      await peerConnection.setRemoteDescription(offer)

      // Add queued ICE candidates
      for (const candidate of iceCandidatesQueue.current) {
        await peerConnection.addIceCandidate(candidate)
      }
      iceCandidatesQueue.current = []

      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)
      return answer
    } catch (error) {
      console.error('Failed to create answer:', error)
      setError('Failed to create connection answer')
      return null
    }
  }, [initializePeerConnection])

  const setRemoteDescription = useCallback(async (
    description: RTCSessionDescriptionInit
  ): Promise<void> => {
    try {
      const peerConnection = initializePeerConnection()
      await peerConnection.setRemoteDescription(description)

      // Add queued ICE candidates
      for (const candidate of iceCandidatesQueue.current) {
        await peerConnection.addIceCandidate(candidate)
      }
      iceCandidatesQueue.current = []
    } catch (error) {
      console.error('Failed to set remote description:', error)
      setError('Failed to set remote connection description')
    }
  }, [initializePeerConnection])

  const addIceCandidate = useCallback(async (
    candidate: RTCIceCandidateInit
  ): Promise<void> => {
    try {
      const peerConnection = peerConnectionRef.current
      
      if (peerConnection && peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(candidate)
      } else {
        // Queue candidate if remote description not set yet
        iceCandidatesQueue.current.push(candidate)
      }
    } catch (error) {
      console.error('Failed to add ICE candidate:', error)
      setError('Failed to add connection candidate')
    }
  }, [])

  const startLocalStream = useCallback(async (config: StreamConfig): Promise<void> => {
    try {
      setError(null)

      let stream: MediaStream | null = null

      // Get screen share if requested
      if (config.screen) {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: true
        })
      }

      // Get webcam/microphone if requested
      if (config.video || config.audio) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
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

        if (stream) {
          // Combine streams - use screen video, prefer screen audio but fallback to mic
          const combinedStream = new MediaStream()
          
          // Add screen video tracks
          stream.getVideoTracks().forEach(track => {
            combinedStream.addTrack(track)
          })
          
          // Add audio tracks (prefer screen audio)
          const screenAudioTracks = stream.getAudioTracks()
          if (screenAudioTracks.length > 0) {
            screenAudioTracks.forEach(track => {
              combinedStream.addTrack(track)
            })
          } else {
            // Use microphone audio
            userMediaStream.getAudioTracks().forEach(track => {
              combinedStream.addTrack(track)
            })
          }
          
          stream = combinedStream
        } else {
          stream = userMediaStream
        }
      }

      if (!stream) {
        throw new Error('No media stream could be acquired')
      }

      setLocalStream(stream)

      // Add tracks to peer connection
      const peerConnection = initializePeerConnection()
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream!)
      })

    } catch (error) {
      console.error('Failed to start local stream:', error)
      setError(`Failed to access ${config.screen ? 'screen' : 'camera/microphone'}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [initializePeerConnection])

  const stopLocalStream = useCallback((): void => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
  }, [localStream])

  const sendData = useCallback((data: any): void => {
    const dataChannel = dataChannelRef.current
    if (dataChannel && dataChannel.readyState === 'open') {
      try {
        dataChannel.send(JSON.stringify(data))
      } catch (error) {
        console.error('Failed to send data:', error)
      }
    }
  }, [])

  const closeConnection = useCallback((): void => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    if (dataChannelRef.current) {
      dataChannelRef.current.close()
      dataChannelRef.current = null
    }

    stopLocalStream()
    setRemoteStream(null)
    setConnectionState('closed')
    setError(null)
  }, [stopLocalStream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeConnection()
    }
  }, [closeConnection])

  const isConnected = connectionState === 'connected'

  return {
    localStream,
    remoteStream,
    connectionState,
    isConnected,
    error,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    startLocalStream,
    stopLocalStream,
    sendData,
    closeConnection
  }
}

// Hook for managing multiple peer connections (for streamers with multiple viewers)
export function useWebRTCHost() {
  const [connections, setConnections] = useState<Map<string, RTCPeerConnection>>(new Map())
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [viewerCount, setViewerCount] = useState(0)

  const addViewer = useCallback(async (viewerId: string): Promise<RTCPeerConnection> => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    })

    // Add local stream tracks if available
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream)
      })
    }

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed' ||
          peerConnection.connectionState === 'closed') {
        removeViewer(viewerId)
      }
    }

    setConnections(prev => new Map(prev.set(viewerId, peerConnection)))
    setViewerCount(prev => prev + 1)

    return peerConnection
  }, [localStream])

  const removeViewer = useCallback((viewerId: string): void => {
    const connection = connections.get(viewerId)
    if (connection) {
      connection.close()
      setConnections(prev => {
        const newMap = new Map(prev)
        newMap.delete(viewerId)
        return newMap
      })
      setViewerCount(prev => Math.max(0, prev - 1))
    }
  }, [connections])

  const broadcastToAll = useCallback((data: any): void => {
    connections.forEach((connection, viewerId) => {
      // Send data via data channel if available
      // Implementation depends on your data channel setup
      console.log(`Broadcasting to ${viewerId}:`, data)
    })
  }, [connections])

  const setHostStream = useCallback((stream: MediaStream | null): void => {
    setLocalStream(stream)

    // Update all existing connections with new stream
    connections.forEach((peerConnection) => {
      // Remove old tracks
      const senders = peerConnection.getSenders()
      senders.forEach(sender => {
        if (sender.track) {
          peerConnection.removeTrack(sender)
        }
      })

      // Add new tracks
      if (stream) {
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream)
        })
      }
    })
  }, [connections])

  const closeAllConnections = useCallback((): void => {
    connections.forEach(connection => connection.close())
    setConnections(new Map())
    setViewerCount(0)
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
  }, [connections, localStream])

  return {
    connections,
    localStream,
    viewerCount,
    addViewer,
    removeViewer,
    broadcastToAll,
    setHostStream,
    closeAllConnections
  }
}