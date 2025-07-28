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
  private peer: any = null;
  private connections: Map<string, any> = new Map();
  private streamStats: StreamStats = {
    isLive: false,
    viewerCount: 0,
    duration: 0,
    bitrate: 0,
    quality: 'auto',
  };
  private streamId: string | null = null;

  constructor() {
    // Initialize Peer.js when available
    if (typeof window !== 'undefined') {
      this.initializePeer();
    }
  }

  private async initializePeer() {
    try {
      const { Peer } = await import('peerjs');
      
      // Generate a unique streamer ID
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
        } else {
          // Answer with empty stream to maintain connection
          call.answer(new MediaStream());
          console.log('Answered call with empty stream (no local stream available)');
        }

        // Track connection
        call.on('stream', (remoteStream: MediaStream) => {
          console.log('Received stream from viewer (unexpected):', remoteStream);
        });

        call.on('close', () => {
          console.log('Call closed with viewer:', call.peer);
        });
      });

      this.peer.on('connection', (conn: any) => {
        console.log('New viewer connected:', conn.peer);
        this.connections.set(conn.peer, conn);
        this.updateViewerCount();

        conn.on('data', (data: any) => {
          console.log('Received data from viewer:', data);
        });

        conn.on('close', () => {
          console.log('Viewer disconnected:', conn.peer);
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
        const webcamStream = await navigator.mediaDevices.getUserMedia({
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
          webcamStream.getTracks().map(track => `${track.kind}: ${track.label || 'unlabeled'}`));

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
            webcamStream.getAudioTracks().forEach(track => {
              mergedStream.addTrack(track);
            });
          }

          combinedStream = mergedStream;
          
          // Store reference to webcam stream for later use
          this.localStream = webcamStream;
        } else {
          // Use webcam stream only
          combinedStream = webcamStream;
          this.localStream = webcamStream;
        }
      }

      if (!combinedStream) {
        throw new Error('No media stream could be acquired');
      }

      // Set the combined stream as the main local stream
      this.localStream = combinedStream;

      this.streamStats.isLive = true;
      this.streamStats.quality = config.quality;
      
      console.log('Stream started successfully with combined tracks:', 
        this.localStream.getTracks().map(track => `${track.kind}: ${track.label || 'unlabeled'}`));
      
      // Return peer ID for viewers to connect
      return this.streamId || this.peer?.id || 'unknown-stream-id';
    } catch (error) {
      console.error('Failed to start stream:', error);
      throw new Error(`Failed to start stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

    // Close all peer connections
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
    
    console.log('Stream stopped successfully');
  }

  private handleScreenShareEnded(): void {
    console.log('Handling screen share end...');
    
    // If we have a webcam stream, switch back to it
    if (this.localStream !== this.screenStream) {
      // We have a separate webcam stream, use it
      this.screenStream = null;
      // The localStream should still have webcam tracks
    } else {
      // Screen was the only stream, stop everything
      this.stopStream();
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getScreenStream(): MediaStream | null {
    return this.screenStream;
  }

  getStreamStats(): StreamStats {
    return { ...this.streamStats };
  }

  getStreamId(): string | null {
    return this.streamId;
  }

  private updateViewerCount(): void {
    this.streamStats.viewerCount = this.connections.size;
    console.log('Updated viewer count:', this.streamStats.viewerCount);
  }

  // Connect as viewer
  async connectToStream(streamerId: string): Promise<MediaStream | null> {
    if (!this.peer) {
      await this.initializePeer();
    }

    return new Promise((resolve, reject) => {
      console.log('Attempting to connect to streamer:', streamerId);
      
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
        reject(error);
      });

      call.on('close', () => {
        console.log('Call to streamer closed');
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);
    });
  }

  // Check if screen sharing is supported
  isScreenShareSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  }

  // Destroy peer connection
  destroy(): void {
    this.stopStream();
    
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    
    this.streamId = null;
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