import { useState, useEffect, useCallback } from 'react'

export interface StreamError {
  code: string
  message: string
  details?: any
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'network' | 'device' | 'permission' | 'stream' | 'browser' | 'server'
  recoverable: boolean
}

export interface ErrorRecoveryAction {
  label: string
  action: () => Promise<void> | void
  description: string
}

// Error codes and their metadata
export const ERROR_CODES = {
  // Network errors
  NETWORK_DISCONNECTED: {
    code: 'NETWORK_DISCONNECTED',
    message: 'Network connection lost',
    severity: 'high' as const,
    category: 'network' as const,
    recoverable: true
  },
  NETWORK_SLOW: {
    code: 'NETWORK_SLOW',
    message: 'Network connection is too slow for streaming',
    severity: 'medium' as const,
    category: 'network' as const,
    recoverable: true
  },
  SERVER_UNREACHABLE: {
    code: 'SERVER_UNREACHABLE',
    message: 'Cannot connect to streaming server',
    severity: 'high' as const,
    category: 'server' as const,
    recoverable: true
  },

  // Device errors
  CAMERA_NOT_FOUND: {
    code: 'CAMERA_NOT_FOUND',
    message: 'No camera device found',
    severity: 'medium' as const,
    category: 'device' as const,
    recoverable: false
  },
  MICROPHONE_NOT_FOUND: {
    code: 'MICROPHONE_NOT_FOUND',
    message: 'No microphone device found',
    severity: 'medium' as const,
    category: 'device' as const,
    recoverable: false
  },
  DEVICE_IN_USE: {
    code: 'DEVICE_IN_USE',
    message: 'Camera or microphone is being used by another application',
    severity: 'high' as const,
    category: 'device' as const,
    recoverable: true
  },

  // Permission errors
  CAMERA_PERMISSION_DENIED: {
    code: 'CAMERA_PERMISSION_DENIED',
    message: 'Camera permission denied',
    severity: 'high' as const,
    category: 'permission' as const,
    recoverable: true
  },
  MICROPHONE_PERMISSION_DENIED: {
    code: 'MICROPHONE_PERMISSION_DENIED', 
    message: 'Microphone permission denied',
    severity: 'high' as const,
    category: 'permission' as const,
    recoverable: true
  },
  SCREEN_SHARE_PERMISSION_DENIED: {
    code: 'SCREEN_SHARE_PERMISSION_DENIED',
    message: 'Screen sharing permission denied',
    severity: 'medium' as const,
    category: 'permission' as const,
    recoverable: true
  },

  // Stream errors
  STREAM_FAILED: {
    code: 'STREAM_FAILED',
    message: 'Failed to start stream',
    severity: 'critical' as const,
    category: 'stream' as const,
    recoverable: true
  },
  STREAM_INTERRUPTED: {
    code: 'STREAM_INTERRUPTED',
    message: 'Stream was interrupted unexpectedly',
    severity: 'high' as const,
    category: 'stream' as const,
    recoverable: true
  },
  PEER_CONNECTION_FAILED: {
    code: 'PEER_CONNECTION_FAILED',
    message: 'Failed to establish peer connection',
    severity: 'high' as const,
    category: 'stream' as const,
    recoverable: true
  },

  // Browser errors
  BROWSER_NOT_SUPPORTED: {
    code: 'BROWSER_NOT_SUPPORTED',
    message: 'Browser does not support required features',
    severity: 'critical' as const,
    category: 'browser' as const,
    recoverable: false
  },
  WEBRTC_NOT_SUPPORTED: {
    code: 'WEBRTC_NOT_SUPPORTED',
    message: 'WebRTC is not supported',
    severity: 'critical' as const,
    category: 'browser' as const,
    recoverable: false
  },
  INSECURE_CONTEXT: {
    code: 'INSECURE_CONTEXT',
    message: 'Streaming requires HTTPS or localhost',
    severity: 'critical' as const,
    category: 'browser' as const,
    recoverable: false
  }
} as const

class ErrorHandler {
  private errorLog: StreamError[] = []
  private errorListeners: Array<(error: StreamError) => void> = []
  private maxLogSize = 100

  // Convert native errors to StreamError
  convertError(error: any, context?: string): StreamError {
    let streamError: StreamError

    if (error instanceof DOMException) {
      streamError = this.handleDOMException(error, context)
    } else if (error instanceof Error) {
      streamError = this.handleGenericError(error, context)
    } else if (typeof error === 'string') {
      streamError = {
        code: 'UNKNOWN_ERROR',
        message: error,
        timestamp: new Date(),
        severity: 'medium',
        category: 'stream',
        recoverable: true
      }
    } else {
      streamError = {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
        details: error,
        timestamp: new Date(),
        severity: 'medium',
        category: 'stream',
        recoverable: true
      }
    }

    this.logError(streamError)
    return streamError
  }

  // Handle DOMException errors (common in WebRTC)
  private handleDOMException(error: DOMException, context?: string): StreamError {
    const timestamp = new Date()

    switch (error.name) {
      case 'NotAllowedError':
        if (context?.includes('camera') || context?.includes('video')) {
          return {
            ...ERROR_CODES.CAMERA_PERMISSION_DENIED,
            timestamp,
            details: { originalError: error, context }
          }
        } else if (context?.includes('microphone') || context?.includes('audio')) {
          return {
            ...ERROR_CODES.MICROPHONE_PERMISSION_DENIED,
            timestamp,
            details: { originalError: error, context }
          }
        } else if (context?.includes('screen') || context?.includes('display')) {
          return {
            ...ERROR_CODES.SCREEN_SHARE_PERMISSION_DENIED,
            timestamp,
            details: { originalError: error, context }
          }
        }
        break

      case 'NotFoundError':
        if (context?.includes('camera') || context?.includes('video')) {
          return {
            ...ERROR_CODES.CAMERA_NOT_FOUND,
            timestamp,
            details: { originalError: error, context }
          }
        } else if (context?.includes('microphone') || context?.includes('audio')) {
          return {
            ...ERROR_CODES.MICROPHONE_NOT_FOUND,
            timestamp,
            details: { originalError: error, context }
          }
        }
        break

      case 'NotReadableError':
        return {
          ...ERROR_CODES.DEVICE_IN_USE,
          timestamp,
          details: { originalError: error, context }
        }

      case 'OverconstrainedError':
        return {
          code: 'DEVICE_CONSTRAINTS_ERROR',
          message: 'Device does not support requested settings',
          timestamp,
          severity: 'medium',
          category: 'device',
          recoverable: true,
          details: { originalError: error, context }
        }
    }

    // Default DOMException handling
    return {
      code: 'DOM_EXCEPTION',
      message: error.message || 'Device or permission error',
      timestamp,
      severity: 'medium',
      category: 'device',
      recoverable: true,
      details: { originalError: error, context }
    }
  }

  // Handle generic JavaScript errors
  private handleGenericError(error: Error, context?: string): StreamError {
    const timestamp = new Date()

    // Network-related errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        ...ERROR_CODES.NETWORK_DISCONNECTED,
        timestamp,
        details: { originalError: error, context }
      }
    }

    // WebRTC-related errors
    if (error.message.includes('peer') || error.message.includes('connection')) {
      return {
        ...ERROR_CODES.PEER_CONNECTION_FAILED,
        timestamp,
        details: { originalError: error, context }
      }
    }

    // Generic error
    return {
      code: 'GENERIC_ERROR',
      message: error.message || 'An unexpected error occurred',
      timestamp,
      severity: 'medium',
      category: 'stream',
      recoverable: true,
      details: { originalError: error, context }
    }
  }

  // Log error to internal log
  private logError(error: StreamError): void {
    this.errorLog.push(error)
    
    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift()
    }

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(error)
      } catch (err) {
        console.error('Error in error listener:', err)
      }
    })

    // Log to console based on severity
    const logMethod = error.severity === 'critical' ? console.error :
                     error.severity === 'high' ? console.error :
                     error.severity === 'medium' ? console.warn :
                     console.log

    logMethod(`[${error.code}] ${error.message}`, error.details)
  }

  // Add error listener
  onError(listener: (error: StreamError) => void): () => void {
    this.errorListeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.errorListeners.indexOf(listener)
      if (index > -1) {
        this.errorListeners.splice(index, 1)
      }
    }
  }

  // Get recovery actions for an error
  getRecoveryActions(error: StreamError): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = []

    switch (error.code) {
      case 'CAMERA_PERMISSION_DENIED':
      case 'MICROPHONE_PERMISSION_DENIED':
        actions.push({
          label: 'Grant Permission',
          description: 'Click to grant camera/microphone permission',
          action: async () => {
            try {
              await navigator.mediaDevices.getUserMedia({ 
                video: error.code.includes('CAMERA'), 
                audio: error.code.includes('MICROPHONE') 
              })
            } catch (err) {
              throw new Error('Permission still denied')
            }
          }
        })
        break

      case 'SCREEN_SHARE_PERMISSION_DENIED':
        actions.push({
          label: 'Try Screen Share Again',
          description: 'Attempt screen sharing again',
          action: async () => {
            try {
              await navigator.mediaDevices.getDisplayMedia({ video: true })
            } catch (err) {
              throw new Error('Screen share permission still denied')
            }
          }
        })
        break

      case 'NETWORK_DISCONNECTED':
        actions.push({
          label: 'Retry Connection',
          description: 'Check network and retry',
          action: async () => {
            if (!navigator.onLine) {
              throw new Error('Still offline')
            }
            // Additional network checks could go here
          }
        })
        break

      case 'DEVICE_IN_USE':
        actions.push({
          label: 'Close Other Apps',
          description: 'Close other applications using camera/microphone',
          action: () => {
            // Can't programmatically close other apps, but can retry
            alert('Please close other applications that might be using your camera or microphone, then try again.')
          }
        })
        break

      case 'STREAM_FAILED':
      case 'STREAM_INTERRUPTED':
      case 'PEER_CONNECTION_FAILED':
        actions.push({
          label: 'Restart Stream',
          description: 'Restart the streaming session',
          action: async () => {
            // This would be implemented by the calling component
            window.location.reload()
          }
        })
        break
    }

    // Common recovery actions for recoverable errors
    if (error.recoverable) {
      actions.push({
        label: 'Refresh Page',
        description: 'Reload the page to reset the application',
        action: () => {
          window.location.reload()
        }
      })
    }

    return actions
  }

  // Get user-friendly error message
  getUserMessage(error: StreamError): string {
    const baseMessage = error.message

    switch (error.code) {
      case 'CAMERA_PERMISSION_DENIED':
        return 'We need access to your camera to start streaming. Please allow camera permission and try again.'
      
      case 'MICROPHONE_PERMISSION_DENIED':
        return 'We need access to your microphone for audio. Please allow microphone permission and try again.'
      
      case 'SCREEN_SHARE_PERMISSION_DENIED':
        return 'Screen sharing was cancelled. Click "Start Screen Share" to try again.'
      
      case 'CAMERA_NOT_FOUND':
        return 'No camera found. Please connect a camera device to start video streaming.'
      
      case 'MICROPHONE_NOT_FOUND':
        return 'No microphone found. Please connect a microphone device for audio.'
      
      case 'DEVICE_IN_USE':
        return 'Your camera or microphone is being used by another application. Please close other apps and try again.'
      
      case 'NETWORK_DISCONNECTED':
        return 'Internet connection lost. Please check your network connection and try again.'
      
      case 'NETWORK_SLOW':
        return 'Your internet connection is too slow for streaming. Try reducing the quality or check your connection.'
      
      case 'BROWSER_NOT_SUPPORTED':
        return 'Your browser doesn\'t support streaming. Please use a modern browser like Chrome, Firefox, or Safari.'
      
      case 'WEBRTC_NOT_SUPPORTED':
        return 'Your browser doesn\'t support WebRTC, which is required for streaming.'
      
      case 'INSECURE_CONTEXT':
        return 'Streaming requires a secure connection (HTTPS). Please use HTTPS or localhost.'

      default:
        return baseMessage
    }
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number
    errorsByCategory: Record<string, number>
    errorsBySeverity: Record<string, number>
    recentErrors: StreamError[]
  } {
    const errorsByCategory: Record<string, number> = {}
    const errorsBySeverity: Record<string, number> = {}

    this.errorLog.forEach(error => {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1
    })

    return {
      totalErrors: this.errorLog.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrors: this.errorLog.slice(-10)
    }
  }

  // Clear error log
  clearLog(): void {
    this.errorLog = []
  }

  // Check for critical errors that should stop streaming
  hasCriticalErrors(): boolean {
    return this.errorLog.some(error => 
      error.severity === 'critical' && 
      Date.now() - error.timestamp.getTime() < 60000 // Within last minute
    )
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler()

// Utility functions
export function handleStreamError(error: any, context?: string): StreamError {
  return errorHandler.convertError(error, context)
}

export function isRecoverableError(error: StreamError): boolean {
  return error.recoverable
}

export function getCriticalErrors(): StreamError[] {
  return errorHandler.getErrorStats().recentErrors.filter(error => 
    error.severity === 'critical'
  )
}

// React hook for error handling
export function useErrorHandler() {
  const [errors, setErrors] = useState<StreamError[]>([])
  const [hasErrors, setHasErrors] = useState(false)

  useEffect(() => {
    const unsubscribe = errorHandler.onError((error) => {
      setErrors((prev: StreamError[]) => [...prev, error].slice(-10)) // Keep last 10 errors
      setHasErrors(true)
    })

    return unsubscribe
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
    setHasErrors(false)
  }, [])

  const handleError = useCallback((error: any, context?: string) => {
    return errorHandler.convertError(error, context)
  }, [])

  const getRecoveryActions = useCallback((error: StreamError) => {
    return errorHandler.getRecoveryActions(error)
  }, [])

  const getUserMessage = useCallback((error: StreamError) => {
    return errorHandler.getUserMessage(error)
  }, [])

  return {
    errors,
    hasErrors,
    clearErrors,
    handleError,
    getRecoveryActions,
    getUserMessage
  }
}