'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react'

type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error' | 'reconnecting'

interface ConnectionStatusProps {
  streamId?: string
  isStreamer?: boolean
  onConnectionChange?: (status: ConnectionState) => void
  className?: string
}

export default function ConnectionStatus({
  streamId,
  isStreamer = false,
  onConnectionChange,
  className = ''
}: ConnectionStatusProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [latency, setLatency] = useState<number | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null)

  // Monitor connection status
  useEffect(() => {
    if (!streamId) {
      setConnectionState('disconnected')
      return
    }

    let heartbeatInterval: NodeJS.Timeout
    let connectionCheckInterval: NodeJS.Timeout

    const checkConnection = async () => {
      try {
        const startTime = Date.now()
        
        // Check stream status
        const response = await fetch(`/api/stream/status?sessionId=${streamId}`)
        const endTime = Date.now()
        
        if (response.ok) {
          const data = await response.json()
          
          if (data.success) {
            setConnectionState('connected')
            setLatency(endTime - startTime)
            setLastHeartbeat(new Date())
            setReconnectAttempts(0)
            
            if (onConnectionChange) {
              onConnectionChange('connected')
            }
          } else {
            throw new Error('Stream not available')
          }
        } else {
          throw new Error('Connection failed')
        }
      } catch (error) {
        console.error('Connection check failed:', error)
        
        if (connectionState === 'connected') {
          setConnectionState('reconnecting')
          setReconnectAttempts(prev => prev + 1)
          
          if (onConnectionChange) {
            onConnectionChange('reconnecting')
          }
        } else {
          setConnectionState('error')
          
          if (onConnectionChange) {
            onConnectionChange('error')
          }
        }
      }
    }

    // Initial connection check
    setConnectionState('connecting')
    if (onConnectionChange) {
      onConnectionChange('connecting')
    }
    
    checkConnection()

    // Set up periodic checks
    connectionCheckInterval = setInterval(checkConnection, 5000)

    // Heartbeat for streamers
    if (isStreamer) {
      heartbeatInterval = setInterval(async () => {
        try {
          await fetch('/api/stream/public', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              streamId,
              action: 'heartbeat'
            })
          })
        } catch (error) {
          console.error('Heartbeat failed:', error)
        }
      }, 30000)
    }

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval)
      if (connectionCheckInterval) clearInterval(connectionCheckInterval)
    }
  }, [streamId, isStreamer, onConnectionChange, connectionState])

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      if (connectionState === 'error' || connectionState === 'disconnected') {
        setConnectionState('connecting')
        if (onConnectionChange) {
          onConnectionChange('connecting')
        }
      }
    }

    const handleOffline = () => {
      setConnectionState('disconnected')
      if (onConnectionChange) {
        onConnectionChange('disconnected')
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [connectionState, onConnectionChange])

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'connecting':
      case 'reconnecting':
        return <Wifi className="w-4 h-4 text-yellow-400 animate-pulse" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'disconnected':
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'reconnecting':
        return `Reconnecting... (${reconnectAttempts})`
      case 'error':
        return 'Connection Error'
      case 'disconnected':
      default:
        return 'Disconnected'
    }
  }

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'connecting':
      case 'reconnecting':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'error':
        return 'text-red-400 bg-red-500/20 border-red-500/30'
      case 'disconnected':
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span className="text-sm font-medium">{getStatusText()}</span>
      
      {/* Latency indicator */}
      {connectionState === 'connected' && latency !== null && (
        <span className="text-xs opacity-75">
          ({latency}ms)
        </span>
      )}
      
      {/* Last heartbeat for streamers */}
      {isStreamer && lastHeartbeat && connectionState === 'connected' && (
        <span className="text-xs opacity-75">
          ✓ {lastHeartbeat.toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}

// Connection status hook
export function useConnectionStatus(streamId?: string, isStreamer = false) {
  const [status, setStatus] = useState<ConnectionState>('disconnected')
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    connectionState: status,
    isOnline,
    setConnectionState: setStatus
  }
}