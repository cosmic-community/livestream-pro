import { StreamConfig } from '@/types'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface StreamRequirements {
  minResolution: { width: number; height: number }
  maxResolution: { width: number; height: number }
  minFrameRate: number
  maxFrameRate: number
  minBitrate: number
  maxBitrate: number
  supportedCodecs: string[]
  supportedFormats: string[]
}

// Default streaming requirements
export const DEFAULT_STREAM_REQUIREMENTS: StreamRequirements = {
  minResolution: { width: 640, height: 360 },
  maxResolution: { width: 1920, height: 1080 },
  minFrameRate: 15,
  maxFrameRate: 60,
  minBitrate: 500_000, // 500 kbps
  maxBitrate: 8_000_000, // 8 Mbps
  supportedCodecs: ['H264', 'VP8', 'VP9'],
  supportedFormats: ['webm', 'mp4']
}

// Validate stream configuration
export function validateStreamConfig(config: StreamConfig): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check if at least one media source is enabled
  if (!config.video && !config.audio && !config.screen) {
    errors.push('At least one media source (video, audio, or screen) must be enabled')
  }

  // Validate quality setting
  const validQualities = ['auto', 'low', 'medium', 'high']
  if (!validQualities.includes(config.quality)) {
    errors.push(`Invalid quality setting: ${config.quality}. Must be one of: ${validQualities.join(', ')}`)
  }

  // Quality-specific warnings
  if (config.quality === 'high' && !config.video && !config.screen) {
    warnings.push('High quality setting is unnecessary without video enabled')
  }

  if (config.quality === 'low' && config.screen) {
    warnings.push('Low quality may result in poor screen sharing experience')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Validate browser capabilities
export async function validateBrowserCapabilities(): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Check WebRTC support
  if (!window.RTCPeerConnection) {
    errors.push('WebRTC is not supported in this browser')
  }

  // Check getUserMedia support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    errors.push('Camera/microphone access is not supported in this browser')
  }

  // Check getDisplayMedia support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    warnings.push('Screen sharing is not supported in this browser')
  }

  // Check for secure context (HTTPS/localhost)
  if (!window.isSecureContext) {
    errors.push('Streaming requires a secure context (HTTPS or localhost)')
  }

  // Test camera access
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    stream.getTracks().forEach(track => track.stop())
  } catch (error) {
    warnings.push('Camera/microphone permission may be required')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Validate media stream
export function validateMediaStream(stream: MediaStream): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!stream) {
    errors.push('Media stream is null or undefined')
    return { isValid: false, errors, warnings }
  }

  const videoTracks = stream.getVideoTracks()
  const audioTracks = stream.getAudioTracks()

  // Check if stream has any tracks
  if (videoTracks.length === 0 && audioTracks.length === 0) {
    errors.push('Media stream has no tracks')
  }

  // Validate video tracks
  videoTracks.forEach((track, index) => {
    if (track.readyState !== 'live') {
      errors.push(`Video track ${index} is not live (state: ${track.readyState})`)
    }

    const settings = track.getSettings()
    if (settings.width && settings.height) {
      if (settings.width < DEFAULT_STREAM_REQUIREMENTS.minResolution.width ||
          settings.height < DEFAULT_STREAM_REQUIREMENTS.minResolution.height) {
        warnings.push(`Video track ${index} resolution is below recommended minimum`)
      }

      if (settings.width > DEFAULT_STREAM_REQUIREMENTS.maxResolution.width ||
          settings.height > DEFAULT_STREAM_REQUIREMENTS.maxResolution.height) {
        warnings.push(`Video track ${index} resolution exceeds recommended maximum`)
      }
    }

    if (settings.frameRate) {
      if (settings.frameRate < DEFAULT_STREAM_REQUIREMENTS.minFrameRate) {
        warnings.push(`Video track ${index} frame rate is below recommended minimum`)
      }
      if (settings.frameRate > DEFAULT_STREAM_REQUIREMENTS.maxFrameRate) {
        warnings.push(`Video track ${index} frame rate exceeds recommended maximum`)
      }
    }
  })

  // Validate audio tracks
  audioTracks.forEach((track, index) => {
    if (track.readyState !== 'live') {
      errors.push(`Audio track ${index} is not live (state: ${track.readyState})`)
    }

    const settings = track.getSettings()
    if (settings.sampleRate && settings.sampleRate < 44100) {
      warnings.push(`Audio track ${index} sample rate is below recommended 44.1kHz`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Validate network conditions
export async function validateNetworkConditions(): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Check online status
  if (!navigator.onLine) {
    errors.push('No network connection detected')
    return { isValid: false, errors, warnings }
  }

  // Estimate bandwidth (simplified)
  try {
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection

    if (connection) {
      const effectiveType = connection.effectiveType
      const downlink = connection.downlink // Mbps

      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          errors.push('Network connection is too slow for streaming')
          break
        case '3g':
          warnings.push('Network connection may cause quality issues')
          break
        case '4g':
          if (downlink < 2) {
            warnings.push('Network bandwidth may be insufficient for high quality streaming')
          }
          break
      }

      // Check for metered connection
      if (connection.saveData) {
        warnings.push('Data saver mode is enabled, streaming quality may be reduced')
      }
    }
  } catch (error) {
    // Network API not available, continue without network validation
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Validate device capabilities
export async function validateDeviceCapabilities(): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Get available devices
    const devices = await navigator.mediaDevices.enumerateDevices()
    
    const videoDevices = devices.filter(device => device.kind === 'videoinput')
    const audioDevices = devices.filter(device => device.kind === 'audioinput')

    if (videoDevices.length === 0) {
      warnings.push('No camera devices detected')
    }

    if (audioDevices.length === 0) {
      warnings.push('No microphone devices detected')
    }

    // Check device permissions
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: videoDevices.length > 0, 
        audio: audioDevices.length > 0 
      })
      stream.getTracks().forEach(track => track.stop())
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errors.push('Camera/microphone permissions denied')
        } else if (error.name === 'NotFoundError') {
          warnings.push('No camera/microphone devices found')
        } else {
          warnings.push(`Device access error: ${error.message}`)
        }
      }
    }

    // Check for mobile device limitations
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobile = /mobile|android|iphone|ipad/.test(userAgent)
    
    if (isMobile) {
      warnings.push('Mobile devices may have streaming limitations')
      
      // iOS specific warnings
      if (/iphone|ipad/.test(userAgent)) {
        warnings.push('iOS devices may require user interaction to start streaming')
      }
    }

  } catch (error) {
    errors.push('Failed to enumerate media devices')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Comprehensive validation
export async function validateStreamingSetup(config: StreamConfig): Promise<ValidationResult> {
  const results = await Promise.all([
    Promise.resolve(validateStreamConfig(config)),
    validateBrowserCapabilities(),
    validateNetworkConditions(),
    validateDeviceCapabilities()
  ])

  const allErrors = results.flatMap(result => result.errors)
  const allWarnings = results.flatMap(result => result.warnings)

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  }
}

// Get optimal stream configuration based on device capabilities
export async function getOptimalStreamConfig(): Promise<StreamConfig> {
  const networkResult = await validateNetworkConditions()
  const browserResult = await validateBrowserCapabilities()
  
  let quality: StreamConfig['quality'] = 'medium' // default

  // Adjust quality based on network conditions
  if (networkResult.warnings.some(w => w.includes('slow') || w.includes('insufficient'))) {
    quality = 'low'
  } else if (networkResult.isValid && !networkResult.warnings.length) {
    quality = 'high'
  }

  // Check screen sharing support
  const supportsScreenShare = !browserResult.warnings.some(w => w.includes('Screen sharing'))

  return {
    video: true,
    audio: true,
    screen: false, // Don't enable by default, let user choose
    quality
  }
}

// Stream health monitoring
export class StreamHealthMonitor {
  private healthChecks: Array<{
    timestamp: number
    fps: number
    bitrate: number
    droppedFrames: number
    bandwidth: number
  }> = []

  addHealthCheck(data: {
    fps: number
    bitrate: number
    droppedFrames: number
    bandwidth: number
  }): void {
    this.healthChecks.push({
      timestamp: Date.now(),
      ...data
    })

    // Keep only last 100 checks
    if (this.healthChecks.length > 100) {
      this.healthChecks.shift()
    }
  }

  getHealthStatus(): {
    status: 'good' | 'warning' | 'poor'
    issues: string[]
    suggestions: string[]
  } {
    if (this.healthChecks.length < 5) {
      return {
        status: 'warning',
        issues: ['Insufficient data for health assessment'],
        suggestions: ['Continue streaming to gather performance data']
      }
    }

    const recent = this.healthChecks.slice(-10)
    const avgFps = recent.reduce((sum, check) => sum + check.fps, 0) / recent.length
    const avgBitrate = recent.reduce((sum, check) => sum + check.bitrate, 0) / recent.length
    const totalDroppedFrames = recent.reduce((sum, check) => sum + check.droppedFrames, 0)

    const issues: string[] = []
    const suggestions: string[] = []

    // Check FPS
    if (avgFps < 20) {
      issues.push('Low frame rate detected')
      suggestions.push('Reduce video quality or close other applications')
    }

    // Check bitrate stability
    const bitrateVariation = Math.max(...recent.map(c => c.bitrate)) - Math.min(...recent.map(c => c.bitrate))
    if (bitrateVariation > avgBitrate * 0.5) {
      issues.push('Unstable bitrate')
      suggestions.push('Check network connection stability')
    }

    // Check dropped frames
    if (totalDroppedFrames > recent.length * 2) {
      issues.push('High number of dropped frames')
      suggestions.push('Reduce stream quality or check system performance')
    }

    let status: 'good' | 'warning' | 'poor' = 'good'
    if (issues.length > 2) {
      status = 'poor'
    } else if (issues.length > 0) {
      status = 'warning'
    }

    return { status, issues, suggestions }
  }

  clearHistory(): void {
    this.healthChecks = []
  }
}