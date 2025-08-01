import { StreamConfig } from '@/types'

class WebRTCManager {
  private peers: Map<string, RTCPeerConnection> = new Map()
  private localStream: MediaStream | null = null
  private configuration: RTCConfiguration

  constructor() {
    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    }
  }

  async setLocalStream(stream: MediaStream | null): Promise<void> {
    // Stop previous stream if exists
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
    }

    this.localStream = stream || null

    // Update all peer connections with new stream
    for (const [peerId, peer] of Array.from(this.peers.entries())) {
      if (this.localStream) {
        // Remove old tracks
        const senders = peer.getSenders()
        for (const sender of senders) {
          if (sender.track) {
            peer.removeTrack(sender)
          }
        }

        // Add new tracks
        this.localStream.getTracks().forEach(track => {
          if (this.localStream) {
            peer.addTrack(track, this.localStream)
          }
        })
      }
    }
  }

  async createPeerConnection(peerId: string): Promise<RTCPeerConnection> {
    const peer = new RTCPeerConnection(this.configuration)
    this.peers.set(peerId, peer)

    // Add local stream tracks if available
    if (this.localStream) {
      // Store reference to avoid closure issues with TypeScript
      const localStreamRef = this.localStream
      this.localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStreamRef)
      })
    }

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendICECandidate(peerId, event.candidate)
      }
    }

    // Handle remote stream
    peer.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.handleRemoteStream(peerId, event.streams[0])
      }
    }

    // Handle connection state changes
    peer.onconnectionstatechange = () => {
      console.log(`Peer ${peerId} connection state:`, peer.connectionState)
      
      if (peer.connectionState === 'disconnected' || 
          peer.connectionState === 'failed' || 
          peer.connectionState === 'closed') {
        this.removePeer(peerId)
      }
    }

    return peer
  }

  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const peer = this.peers.get(peerId)
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`)
    }

    const offer = await peer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    })

    await peer.setLocalDescription(offer)
    return offer
  }

  async createAnswer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const peer = this.peers.get(peerId)
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`)
    }

    const answer = await peer.createAnswer()
    await peer.setLocalDescription(answer)
    return answer
  }

  async setRemoteDescription(
    peerId: string, 
    description: RTCSessionDescriptionInit
  ): Promise<void> {
    const peer = this.peers.get(peerId)
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`)
    }

    await peer.setRemoteDescription(description)
  }

  async addICECandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peers.get(peerId)
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`)
    }

    await peer.addIceCandidate(candidate)
  }

  removePeer(peerId: string): void {
    const peer = this.peers.get(peerId)
    if (peer) {
      peer.close()
      this.peers.delete(peerId)
    }
  }

  closeAllConnections(): void {
    for (const [peerId, peer] of Array.from(this.peers.entries())) {
      peer.close()
    }
    this.peers.clear()

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }
  }

  getConnectionStats(peerId: string): Promise<RTCStatsReport> | null {
    const peer = this.peers.get(peerId)
    if (!peer) {
      return null
    }

    return peer.getStats()
  }

  getPeerConnection(peerId: string): RTCPeerConnection | undefined {
    return this.peers.get(peerId)
  }

  getAllPeers(): Map<string, RTCPeerConnection> {
    return this.peers
  }

  // Methods to be implemented by subclasses or event handlers
  private sendICECandidate(peerId: string, candidate: RTCIceCandidate): void {
    // This should be implemented to send ICE candidates via signaling server
    console.log(`Send ICE candidate to ${peerId}:`, candidate)
  }

  private handleRemoteStream(peerId: string, stream: MediaStream): void {
    // This should be implemented to handle incoming remote streams
    console.log(`Received remote stream from ${peerId}:`, stream)
  }

  // Utility methods for media capture
  async getCameraStream(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    const defaultConstraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    }

    return await navigator.mediaDevices.getUserMedia(constraints || defaultConstraints)
  }

  async getScreenStream(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    // Check if screen sharing is supported
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error('Screen sharing is not supported in this browser')
    }

    const defaultConstraints: MediaStreamConstraints = {
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

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(constraints || defaultConstraints)
      
      // Add event listener for when user stops sharing via browser UI
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          console.log('Screen sharing ended via browser UI')
          // Clean up the stream
          stream.getTracks().forEach(track => track.stop())
        })
      }
      
      return stream
    } catch (error) {
      console.error('Failed to get screen stream:', error)
      throw error
    }
  }

  async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter(device => device.kind === 'audioinput')
  }

  async getVideoDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter(device => device.kind === 'videoinput')
  }

  // Screen sharing specific utilities
  isScreenShareSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)
  }

  async checkScreenSharePermission(): Promise<boolean> {
    if (!this.isScreenShareSupported()) {
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('Screen share permission check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const webrtcManager = new WebRTCManager()

// Export utility functions
export const mediaUtils = {
  async getCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('Camera permission denied:', error)
      return false
    }
  },

  async getScreenPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('Screen share permission denied:', error)
      return false
    }
  },

  isWebRTCSupported(): boolean {
    return !!(
      window.RTCPeerConnection &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    )
  },

  isScreenShareSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getDisplayMedia
    )
  },

  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|IPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }
}