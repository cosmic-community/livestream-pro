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

  constructor() {
    // Initialize Peer.js when available
    if (typeof window !== 'undefined') {
      this.initializePeer();
    }
  }

  private async initializePeer() {
    try {
      const { Peer } = await import('peerjs');
      this.peer = new Peer({
        config: webRTCConfig,
      });

      this.peer.on('open', (id: string) => {
        console.log('Peer connection opened:', id);
      });

      this.peer.on('call', (call: any) => {
        // Answer incoming calls with local stream
        if (this.localStream) {
          call.answer(this.localStream);
        }
      });

      this.peer.on('connection', (conn: any) => {
        this.connections.set(conn.peer, conn);
        this.updateViewerCount();

        conn.on('close', () => {
          this.connections.delete(conn.peer);
          this.updateViewerCount();
        });
      });

    } catch (error) {
      console.error('Failed to initialize peer:', error);
    }
  }

  async startStream(config: StreamConfig): Promise<string> {
    try {
      // Get webcam stream
      if (config.video || config.audio) {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: config.video ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          } : false,
          audio: config.audio ? {
            echoCancellation: true,
            noiseSuppression: true
          } : false,
        });
      }

      // Get screen stream if requested
      if (config.screen) {
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: true,
        });

        // Combine streams if both webcam and screen
        if (this.localStream && config.video) {
          const combinedStream = new MediaStream();
          
          // FIXED: Add null checks for MediaStreamTrack
          const screenVideoTracks = this.screenStream.getVideoTracks();
          if (screenVideoTracks.length > 0) {
            const videoTrack = screenVideoTracks[0];
            if (videoTrack) {
              combinedStream.addTrack(videoTrack);
            }
          }
          
          // Add audio from webcam or screen
          const audioTracks = this.localStream.getAudioTracks();
          if (audioTracks.length > 0) {
            const audioTrack = audioTracks[0];
            if (audioTrack) {
              combinedStream.addTrack(audioTrack);
            }
          }
          
          this.localStream = combinedStream;
        } else {
          this.localStream = this.screenStream;
        }
      }

      if (!this.localStream) {
        throw new Error('Failed to get media stream');
      }

      this.streamStats.isLive = true;
      this.streamStats.quality = config.quality;
      
      // Return peer ID for viewers to connect
      return this.peer?.id || 'no-peer-id';
    } catch (error) {
      console.error('Failed to start stream:', error);
      throw new Error('Failed to start stream');
    }
  }

  stopStream(): void {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }

    // Close all peer connections
    this.connections.forEach(conn => conn.close());
    this.connections.clear();

    this.streamStats.isLive = false;
    this.streamStats.viewerCount = 0;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getStreamStats(): StreamStats {
    return { ...this.streamStats };
  }

  private updateViewerCount(): void {
    this.streamStats.viewerCount = this.connections.size;
  }

  // Connect as viewer
  async connectToStream(streamerId: string): Promise<MediaStream | null> {
    if (!this.peer) {
      await this.initializePeer();
    }

    return new Promise((resolve, reject) => {
      const call = this.peer.call(streamerId, new MediaStream());
      
      call.on('stream', (remoteStream: MediaStream) => {
        resolve(remoteStream);
      });

      call.on('error', (error: any) => {
        console.error('Call error:', error);
        reject(error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);
    });
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