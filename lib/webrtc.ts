export const webRTCConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
}

export class WebRTCConnection {
  private peerConnection: RTCPeerConnection
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private onRemoteStream?: (stream: MediaStream) => void
  private onConnectionStateChange?: (state: RTCPeerConnectionState) => void

  constructor(
    onRemoteStream?: (stream: MediaStream) => void,
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  ) {
    this.peerConnection = new RTCPeerConnection(webRTCConfig)
    this.onRemoteStream = onRemoteStream
    this.onConnectionStateChange = onConnectionStateChange
    
    this.setupPeerConnection()
  }

  private setupPeerConnection() {
    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams
      this.remoteStream = remoteStream
      if (this.onRemoteStream) {
        this.onRemoteStream(remoteStream)
      }
    }

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(this.peerConnection.connectionState)
      }
    }

    // Handle ICE connection state
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection.iceConnectionState)
    }

    // Handle ICE gathering state
    this.peerConnection.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', this.peerConnection.iceGatheringState)
    }
  }

  async addLocalStream(stream: MediaStream): Promise<void> {
    this.localStream = stream
    
    // Add tracks to peer connection
    stream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, stream)
    })
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      
      await this.peerConnection.setLocalDescription(offer)
      return offer
    } catch (error) {
      console.error('Error creating offer:', error)
      throw error
    }
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    try {
      await this.peerConnection.setRemoteDescription(offer)
      
      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)
      
      return answer
    } catch (error) {
      console.error('Error creating answer:', error)
      throw error
    }
  }

  async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      await this.peerConnection.setRemoteDescription(answer)
    } catch (error) {
      console.error('Error setting remote answer:', error)
      throw error
    }
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      await this.peerConnection.addIceCandidate(candidate)
    } catch (error) {
      console.error('Error adding ICE candidate:', error)
      throw error
    }
  }

  onIceCandidate(callback: (candidate: RTCIceCandidate | null) => void): void {
    this.peerConnection.onicecandidate = (event) => {
      callback(event.candidate)
    }
  }

  getConnectionState(): RTCPeerConnectionState {
    return this.peerConnection.connectionState
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }

  close(): void {
    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
    }

    // Stop remote stream tracks
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop())
    }

    // Close peer connection
    this.peerConnection.close()

    this.localStream = null
    this.remoteStream = null
  }
}

// Utility functions for WebRTC
export async function getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia(constraints)
  } catch (error) {
    console.error('Error getting user media:', error)
    throw new Error('Failed to access camera/microphone')
  }
}

export async function getDisplayMedia(constraints?: DisplayMediaStreamConstraints): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getDisplayMedia(constraints)
  } catch (error) {
    console.error('Error getting display media:', error)
    throw new Error('Failed to access screen share')
  }
}

export async function enumerateDevices(): Promise<MediaDeviceInfo[]> {
  try {
    return await navigator.mediaDevices.enumerateDevices()
  } catch (error) {
    console.error('Error enumerating devices:', error)
    throw new Error('Failed to get media devices')
  }
}

export function combineStreams(videoStream: MediaStream, audioStream: MediaStream): MediaStream {
  const combinedStream = new MediaStream()
  
  // Add video tracks
  videoStream.getVideoTracks().forEach(track => {
    combinedStream.addTrack(track)
  })
  
  // Add audio tracks
  audioStream.getAudioTracks().forEach(track => {
    combinedStream.addTrack(track)
  })
  
  return combinedStream
}

export function replaceVideoTrack(
  peerConnection: RTCPeerConnection,
  newTrack: MediaStreamTrack
): Promise<void> {
  const sender = peerConnection.getSenders().find(s => 
    s.track && s.track.kind === 'video'
  )
  
  if (sender) {
    return sender.replaceTrack(newTrack)
  }
  
  return Promise.reject(new Error('No video sender found'))
}

export function replaceAudioTrack(
  peerConnection: RTCPeerConnection,
  newTrack: MediaStreamTrack
): Promise<void> {
  const sender = peerConnection.getSenders().find(s => 
    s.track && s.track.kind === 'audio'
  )
  
  if (sender) {
    return sender.replaceTrack(newTrack)
  }
  
  return Promise.reject(new Error('No audio sender found'))
}