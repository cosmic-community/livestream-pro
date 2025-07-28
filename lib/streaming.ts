import { StreamConfig, StreamStats, PeerConfig } from '@/types';

// WebRTC configuration
export const webRTCConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Peer.js configuration
export const peerConfig: PeerConfig = {
  host: 'localhost',
  port: 3001,
  path: '/peerjs',
  secure: false,
};

// Stream utilities
export class StreamManager {
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private webcamStream: MediaStream | null = null;
  private peer: any = null;
  private connections: Map<string, any> = new Map();
  private currentCalls: Map<string, any> = new Map();
  private streamStats: StreamStats = {
    isLive: false,
    viewerCount: 0,
    duration: 0,
    bitrate: 0,
    quality: 'auto',
  };
  private streamId: string | null = null;
  private sessionId: string | null = null;
  private startTime: number = 0;

  constructor() {
    // Initialize Peer.js when available
    if (typeof window !== 'undefined') {
      this.initializePeer();
    }
  }

  private async initializePeer() {
    try {
      const { Peer } = await import('peerjs');
      
      // Generate a unique streamer ID based on session or timestamp
      this.streamId = `streamer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      this.peer = new Peer(this.streamId, {
        config: webRTCConfig,
      });

      this.peer.on('open', (id: string) => {
        console.log('Streamer peer connection opened:', id);
        this.streamId = id;
      });

      this.peer.on('call', (call: any) => {
        console.log('Incoming call from viewer:', call.peer);
        
        // Answer incoming calls with local stream
        if (this.localStream) {
          call.answer(this.localStream);
          console.log('Answered call with stream tracks:', 
            this.localStream.getTracks().map(track => `${track.kind}: ${track.label || 'unlabeled'}`));
          
          // Track the call for management
          this.currentCalls.set(call.peer, call);
          this.updateViewerCount();
        } else {
          // Answer with empty stream to maintain connection
          call.answer(new MediaStream());
          console.log('Answered call with empty stream (no local stream available)');
        }

        call.on('close', () => {
          console.log('Call closed with viewer:', call.peer);
          this.currentCalls.delete(call.peer);
          this.updateViewerCount();
        });

        call.on('error', (error: any) => {
          console.error('Call error with viewer:', call.peer, error);
          this.currentCalls.delete(call.peer);
          this.updateViewerCount();
        });
      });

      this.peer.on('connection', (conn: any) => {
        console.log('New data connection from viewer:', conn.peer);
        this.connections.set(conn.peer, conn);

        conn.on('data', (data: any) => {
          console.log('Received data from viewer:', data);
          // Handle viewer actions like join/leave
          if (data.action === 'join') {
            this.updateViewerCount();
          }
        });

        conn.on('close', () => {
          console.log('Data connection closed with viewer:', conn.peer);
          this.connections.delete(conn.peer);
          this.updateViewerCount();
        });
      });

      this.peer.on('error', (error: any) => {
        console.error('Peer error:', error);
      });

    } catch (error) {
      console.error('Failed to initialize peer:', error);
    }
  }

  async startStream(config: StreamConfig): Promise<string> {
    try {
      console.log('Starting stream with config:', config);

      // Reset previous streams
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
      }

      let combinedStream: MediaStream | null = null;

      // Handle screen sharing
      if (config.screen) {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          throw new Error('Screen sharing is not supported in this browser');
        }

        this.screenStream = await navigator.mediaDevices.getDisplayMedia({
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
        });

        console.log('Screen stream acquired with tracks:', 
          this.screenStream.getTracks().map(track => `${track.kind}: ${track.label || 'unlabeled'}`));

        // Handle when user stops sharing via browser UI
        const videoTrack = this.screenStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.addEventListener('ended', () => {
            console.log('Screen sharing ended by user');
            this.handleScreenShareEnded();
          });
        }

        combinedStream = this.screenStream;
      }

      // Handle webcam/microphone
      if (config.video || config.audio) {
        this.webcamStream = await navigator.mediaDevices.getUserMedia({
          video: config.video ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          } : false,
          audio: config.audio ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } : false,
        });

        console.log('Webcam stream acquired with tracks:', 
          this.webcamStream.getTracks().map(track => `${track.kind}: ${track.label || 'unlabeled'}`));

        if (this.screenStream) {
          // Combine screen and webcam streams
          const mergedStream = new MediaStream();
          
          // Add screen video (primary)
          this.screenStream.getVideoTracks().forEach(track => {
            mergedStream.addTrack(track);
          });
          
          // Add audio (prefer screen audio, fallback to webcam)
          const screenAudioTracks = this.screenStream.getAudioTracks();
          if (screenAudioTracks.length > 0) {
            screenAudioTracks.forEach(track => {
              mergedStream.addTrack(track);
            });
          } else {
            // Use webcam audio as fallback
            this.webcamStream.getAudioTracks().forEach(track => {
              mergedStream.addTrack(track);
            });
          }

          combinedStream = mergedStream;
        } else {
          // Use webcam stream only
          combinedStream = this.webcamStream;
        }
      }

      if (!combinedStream) {
        throw new Error('No media stream could be acquired');
      }

      // Set the combined stream as the main local stream
      this.localStream = combinedStream;

      // Update stream stats
      this.streamStats.isLive = true;
      this.streamStats.quality = config.quality;
      this.startTime = Date.now();
      
      // Update all existing calls with new stream
      this.updateAllCallsWithNewStream();
      
      console.log('Stream started successfully with combined tracks:', 
        this.localStream.getTracks().map(track => `${track.kind}: ${track.label || 'unlabeled'}`));
      
      // Return peer ID for viewers to connect
      return this.streamId || this.peer?.id || 'unknown-stream-id';
    } catch (error) {
      console.error('Failed to start stream:', error);
      throw new Error(`Failed to start stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private updateAllCallsWithNewStream(): void {
    if (!this.localStream) return;

    console.log('Updating all calls with new stream...');
    
    // For PeerJS, we need to create new calls with the updated stream
    // The existing calls can't have their streams updated dynamically
    this.currentCalls.forEach((call, peerId) => {
      try {
        // Close the existing call
        call.close();
        
        // Create a new call with the updated stream
        if (this.peer && this.localStream) {
          const newCall = this.peer.call(peerId, this.localStream);
          this.currentCalls.set(peerId, newCall);
          
          newCall.on('close', () => {
            this.currentCalls.delete(peerId);
            this.updateViewerCount();
          });
        }
      } catch (error) {
        console.error('Error updating call for peer:', peerId, error);
      }
    });
  }

  stopStream(): void {
    console.log('Stopping stream...');

    // Stop all tracks in local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped local track:', track.kind, track.label);
      });
      this.localStream = null;
    }

    // Stop screen stream separately if it exists
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped screen track:', track.kind, track.label);
      });
      this.screenStream = null;
    }

    // Stop webcam stream separately if it exists
    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped webcam track:', track.kind, track.label);
      });
      this.webcamStream = null;
    }

    // Close all peer connections and calls
    this.currentCalls.forEach((call, peerId) => {
      try {
        call.close();
        console.log('Closed call with viewer:', peerId);
      } catch (error) {
        console.error('Error closing call with', peerId, ':', error);
      }
    });
    this.currentCalls.clear();

    this.connections.forEach((conn, peerId) => {
      try {
        conn.close();
        console.log('Closed connection to viewer:', peerId);
      } catch (error) {
        console.error('Error closing connection to', peerId, ':', error);
      }
    });
    this.connections.clear();

    this.streamStats.isLive = false;
    this.streamStats.viewerCount = 0;
    this.startTime = 0;
    
    console.log('Stream stopped successfully');
  }

  private handleScreenShareEnded(): void {
    console.log('Handling screen share end...');
    
    // If we have a webcam stream, switch back to it
    if (this.webcamStream) {
      this.localStream = this.webcamStream;
      this.updateAllCallsWithNewStream();
      console.log('Switched back to webcam stream');
    } else {
      // No webcam stream available, stop the entire stream
      console.log('No webcam available, stopping stream');
      this.stopStream();
    }
    
    // Clean up screen stream
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getScreenStream(): MediaStream | null {
    return this.screenStream;
  }

  getWebcamStream(): MediaStream | null {
    return this.webcamStream;
  }

  getStreamStats(): StreamStats {
    // Update duration if stream is live
    if (this.streamStats.isLive && this.startTime > 0) {
      this.streamStats.duration = Math.floor((Date.now() - this.startTime) / 1000);
    }
    
    return { ...this.streamStats };
  }

  getStreamId(): string | null {
    return this.streamId;
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  private updateViewerCount(): void {
    const totalViewers = this.connections.size + this.currentCalls.size;
    this.streamStats.viewerCount = totalViewers;
    console.log('Updated viewer count:', this.streamStats.viewerCount);
  }

  // Connect as viewer
  async connectToStream(streamerId: string): Promise<MediaStream | null> {
    if (!this.peer) {
      await this.initializePeer();
      
      // Wait for peer to be ready
      await new Promise((resolve) => {
        if (this.peer.open) {
          resolve(void 0);
        } else {
          this.peer.on('open', resolve);
        }
      });
    }

    return new Promise((resolve, reject) => {
      console.log('Attempting to connect to streamer:', streamerId);
      
      try {
        // Create a data connection first
        const dataConnection = this.peer.connect(streamerId);
        
        dataConnection.on('open', () => {
          console.log('Data connection established with streamer');
          dataConnection.send({ action: 'join', viewerId: this.peer.id });
        });

        // Create a dummy stream for the call (required by PeerJS)
        const dummyStream = new MediaStream();
        
        const call = this.peer.call(streamerId, dummyStream);
        
        if (!call) {
          reject(new Error('Failed to initiate call to streamer'));
          return;
        }

        call.on('stream', (remoteStream: MediaStream) => {
          console.log('Received remote stream with tracks:', 
            remoteStream.getTracks().map(track => `${track.kind}: ${track.label || 'unlabeled'}`));
          resolve(remoteStream);
        });

        call.on('error', (error: any) => {
          console.error('Call error:', error);
          reject(new Error(`Call failed: ${error.message || 'Unknown error'}`));
        });

        call.on('close', () => {
          console.log('Call to streamer closed');
        });

        // Timeout after 15 seconds
        setTimeout(() => {
          if (call.open) {
            call.close();
          }
          reject(new Error('Connection timeout - streamer may be offline'));
        }, 15000);

      } catch (error) {
        console.error('Error connecting to streamer:', error);
        reject(error);
      }
    });
  }

  // Update stream configuration while streaming
  async updateStreamConfig(config: StreamConfig): Promise<void> {
    if (!this.streamStats.isLive) {
      throw new Error('Cannot update config when stream is not live');
    }

    console.log('Updating stream configuration:', config);

    // Stop current stream and restart with new config
    const wasLive = this.streamStats.isLive;
    const currentQuality = this.streamStats.quality;
    
    // Temporarily set stats to maintain state
    this.streamStats.isLive = false;
    
    try {
      await this.startStream(config);
      
      // Restore live state
      this.streamStats.isLive = wasLive;
      
      console.log('Stream configuration updated successfully');
    } catch (error) {
      // Restore previous state on error
      this.streamStats.isLive = wasLive;
      this.streamStats.quality = currentQuality;
      throw error;
    }
  }

  // Check if screen sharing is supported
  isScreenShareSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  }

  // Check if webcam is supported
  isWebcamSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  // Get available media devices
  async getAvailableDevices(): Promise<{
    audioDevices: MediaDeviceInfo[];
    videoDevices: MediaDeviceInfo[];
  }> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        audioDevices: devices.filter(device => device.kind === 'audioinput'),
        videoDevices: devices.filter(device => device.kind === 'videoinput')
      };
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      return { audioDevices: [], videoDevices: [] };
    }
  }

  // Destroy peer connection
  destroy(): void {
    this.stopStream();
    
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    
    this.streamId = null;
    this.sessionId = null;
  }
}

// Singleton instance
export const streamManager = new StreamManager();

// Utility functions
export function getStreamQualitySettings(quality: string) {
  switch (quality) {
    case 'low':
      return { width: 640, height: 360, frameRate: 15, bitrate: 500000 };
    case 'medium':
      return { width: 1280, height: 720, frameRate: 30, bitrate: 2000000 };
    case 'high':
      return { width: 1920, height: 1080, frameRate: 60, bitrate: 4000000 };
    default:
      return { width: 1280, height: 720, frameRate: 30, bitrate: 2000000 };
  }
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function detectDeviceType(): string {
  if (typeof window === 'undefined') return 'desktop';
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
    return /ipad|tablet/i.test(userAgent) ? 'tablet' : 'mobile';
  }
  
  return 'desktop';
}

// Screen sharing utilities
export const screenShareUtils = {
  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  },

  async checkPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Screen share permission check failed:', error);
      return false;
    }
  },

  getSupportedConstraints(): MediaTrackSupportedConstraints | null {
    if (!this.isSupported()) {
      return null;
    }

    return navigator.mediaDevices.getSupportedConstraints();
  }
};

// Media device utilities
export const mediaDeviceUtils = {
  async getAvailableDevices(): Promise<{
    audioDevices: MediaDeviceInfo[];
    videoDevices: MediaDeviceInfo[];
  }> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        audioDevices: devices.filter(device => device.kind === 'audioinput'),
        videoDevices: devices.filter(device => device.kind === 'videoinput')
      };
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      return { audioDevices: [], videoDevices: [] };
    }
  },

  async checkPermissions(): Promise<{
    camera: boolean;
    microphone: boolean;
    screen: boolean;
  }> {
    const permissions = {
      camera: false,
      microphone: false,
      screen: false
    };

    // Check camera permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      permissions.camera = true;
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.warn('Camera permission denied:', error);
    }

    // Check microphone permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      permissions.microphone = true;
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.warn('Microphone permission denied:', error);
    }

    // Check screen share permission
    if (screenShareUtils.isSupported()) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        permissions.screen = true;
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.warn('Screen share permission denied:', error);
      }
    }

    return permissions;
  }
};