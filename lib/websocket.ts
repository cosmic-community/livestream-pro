export interface WebSocketMessage {
  type: string
  payload?: any
  timestamp: string
  sessionId?: string
  userId?: string
}

export interface WebSocketConnection {
  id: string
  socket: WebSocket
  sessionId?: string
  userId?: string
  lastPing: number
  isAlive: boolean
}

class WebSocketManager {
  private connections: Map<string, WebSocketConnection> = new Map()
  private reconnectAttempts: Map<string, number> = new Map()
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000
  private pingInterval: number = 30000

  // Create WebSocket connection
  createConnection(
    url: string,
    sessionId?: string,
    userId?: string
  ): Promise<WebSocketConnection> {
    return new Promise((resolve, reject) => {
      try {
        const socket = new WebSocket(url)
        const connectionId = `${sessionId || 'global'}-${userId || Date.now()}`
        
        const connection: WebSocketConnection = {
          id: connectionId,
          socket,
          sessionId,
          userId,
          lastPing: Date.now(),
          isAlive: true
        }

        socket.onopen = () => {
          console.log('WebSocket connection opened:', connectionId)
          this.connections.set(connectionId, connection)
          this.reconnectAttempts.delete(connectionId)
          this.startPingPong(connection)
          resolve(connection)
        }

        socket.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }

        socket.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason)
          this.connections.delete(connectionId)
          
          // Attempt reconnection if not a clean close
          if (event.code !== 1000 && this.shouldReconnect(connectionId)) {
            this.attemptReconnection(url, sessionId, userId)
          }
        }

        socket.onmessage = (event) => {
          this.handleMessage(connection, event.data)
        }

      } catch (error) {
        reject(error)
      }
    })
  }

  // Send message through WebSocket
  sendMessage(connectionId: string, message: WebSocketMessage): boolean {
    const connection = this.connections.get(connectionId)
    
    if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: connection not available')
      return false
    }

    try {
      const messageWithTimestamp = {
        ...message,
        timestamp: new Date().toISOString()
      }
      
      connection.socket.send(JSON.stringify(messageWithTimestamp))
      return true
    } catch (error) {
      console.error('Failed to send WebSocket message:', error)
      return false
    }
  }

  // Broadcast message to all connections in a session
  broadcastToSession(sessionId: string, message: WebSocketMessage): number {
    let sentCount = 0
    
    this.connections.forEach((connection) => {
      if (connection.sessionId === sessionId) {
        if (this.sendMessage(connection.id, message)) {
          sentCount++
        }
      }
    })
    
    return sentCount
  }

  // Handle incoming messages
  private handleMessage(connection: WebSocketConnection, data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data)
      
      switch (message.type) {
        case 'ping':
          this.sendMessage(connection.id, { type: 'pong', timestamp: new Date().toISOString() })
          break
          
        case 'pong':
          connection.lastPing = Date.now()
          connection.isAlive = true
          break
          
        case 'viewer_join':
          this.handleViewerJoin(connection, message)
          break
          
        case 'viewer_leave':
          this.handleViewerLeave(connection, message)
          break
          
        case 'chat_message':
          this.handleChatMessage(connection, message)
          break
          
        case 'stream_update':
          this.handleStreamUpdate(connection, message)
          break
          
        default:
          console.log('Unknown message type:', message.type)
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  // Handle viewer join
  private handleViewerJoin(connection: WebSocketConnection, message: WebSocketMessage): void {
    if (message.sessionId) {
      // Update viewer count for session
      const sessionConnections = Array.from(this.connections.values())
        .filter(conn => conn.sessionId === message.sessionId)
      
      // Broadcast updated viewer count
      this.broadcastToSession(message.sessionId, {
        type: 'viewer_count_update',
        payload: { count: sessionConnections.length },
        timestamp: new Date().toISOString()
      })
    }
  }

  // Handle viewer leave
  private handleViewerLeave(connection: WebSocketConnection, message: WebSocketMessage): void {
    if (message.sessionId) {
      // Similar to viewer join, update count
      const sessionConnections = Array.from(this.connections.values())
        .filter(conn => conn.sessionId === message.sessionId)
      
      this.broadcastToSession(message.sessionId, {
        type: 'viewer_count_update',
        payload: { count: Math.max(0, sessionConnections.length - 1) },
        timestamp: new Date().toISOString()
      })
    }
  }

  // Handle chat message
  private handleChatMessage(connection: WebSocketConnection, message: WebSocketMessage): void {
    if (message.sessionId) {
      // Broadcast chat message to all viewers in session
      this.broadcastToSession(message.sessionId, {
        type: 'chat_message',
        payload: message.payload,
        timestamp: new Date().toISOString(),
        userId: connection.userId
      })
    }
  }

  // Handle stream update
  private handleStreamUpdate(connection: WebSocketConnection, message: WebSocketMessage): void {
    if (message.sessionId) {
      // Broadcast stream status update
      this.broadcastToSession(message.sessionId, {
        type: 'stream_status_update',
        payload: message.payload,
        timestamp: new Date().toISOString()
      })
    }
  }

  // Start ping-pong mechanism to keep connection alive
  private startPingPong(connection: WebSocketConnection): void {
    const pingInterval = setInterval(() => {
      if (connection.socket.readyState === WebSocket.OPEN) {
        if (!connection.isAlive) {
          // Connection is stale, close it
          connection.socket.terminate()
          clearInterval(pingInterval)
          return
        }
        
        connection.isAlive = false
        this.sendMessage(connection.id, { 
          type: 'ping', 
          timestamp: new Date().toISOString() 
        })
      } else {
        clearInterval(pingInterval)
      }
    }, this.pingInterval)
  }

  // Check if should attempt reconnection
  private shouldReconnect(connectionId: string): boolean {
    const attempts = this.reconnectAttempts.get(connectionId) || 0
    return attempts < this.maxReconnectAttempts
  }

  // Attempt reconnection
  private async attemptReconnection(
    url: string,
    sessionId?: string,
    userId?: string
  ): Promise<void> {
    const connectionId = `${sessionId || 'global'}-${userId || Date.now()}`
    const attempts = this.reconnectAttempts.get(connectionId) || 0
    
    if (attempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached for:', connectionId)
      return
    }

    this.reconnectAttempts.set(connectionId, attempts + 1)
    
    // Exponential backoff
    const delay = this.reconnectDelay * Math.pow(2, attempts)
    
    setTimeout(async () => {
      try {
        console.log(`Attempting reconnection ${attempts + 1}/${this.maxReconnectAttempts}`)
        await this.createConnection(url, sessionId, userId)
      } catch (error) {
        console.error('Reconnection failed:', error)
        this.attemptReconnection(url, sessionId, userId)
      }
    }, delay)
  }

  // Close connection
  closeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.socket.close(1000, 'Client closing connection')
      this.connections.delete(connectionId)
    }
  }

  // Close all connections
  closeAllConnections(): void {
    this.connections.forEach((connection) => {
      connection.socket.close(1000, 'Closing all connections')
    })
    this.connections.clear()
    this.reconnectAttempts.clear()
  }

  // Get connection stats
  getConnectionStats(): {
    totalConnections: number
    connectionsBySession: Record<string, number>
    activeConnections: number
  } {
    const connectionsBySession: Record<string, number> = {}
    let activeConnections = 0

    this.connections.forEach((connection) => {
      if (connection.socket.readyState === WebSocket.OPEN) {
        activeConnections++
      }
      
      if (connection.sessionId) {
        connectionsBySession[connection.sessionId] = 
          (connectionsBySession[connection.sessionId] || 0) + 1
      }
    })

    return {
      totalConnections: this.connections.size,
      connectionsBySession,
      activeConnections
    }
  }

  // Get connections for a session
  getSessionConnections(sessionId: string): WebSocketConnection[] {
    return Array.from(this.connections.values())
      .filter(connection => connection.sessionId === sessionId)
  }
}

// Singleton instance
export const wsManager = new WebSocketManager()

// Hook for using WebSocket in React components
export function useWebSocket(url: string, sessionId?: string, userId?: string) {
  const [connection, setConnection] = useState<WebSocketConnection | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<WebSocketMessage[]>([])

  useEffect(() => {
    let connectionInstance: WebSocketConnection | null = null

    const connect = async () => {
      try {
        connectionInstance = await wsManager.createConnection(url, sessionId, userId)
        setConnection(connectionInstance)
        setIsConnected(true)
        setError(null)

        // Listen for messages
        connectionInstance.socket.addEventListener('message', (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            setMessages(prev => [...prev, message])
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err)
          }
        })

        connectionInstance.socket.addEventListener('close', () => {
          setIsConnected(false)
        })

      } catch (err) {
        setError(err instanceof Error ? err.message : 'WebSocket connection failed')
        setIsConnected(false)
      }
    }

    connect()

    return () => {
      if (connectionInstance) {
        wsManager.closeConnection(connectionInstance.id)
      }
    }
  }, [url, sessionId, userId])

  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (connection) {
      return wsManager.sendMessage(connection.id, {
        ...message,
        timestamp: new Date().toISOString()
      })
    }
    return false
  }, [connection])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    connection,
    isConnected,
    error,
    messages,
    sendMessage,
    clearMessages
  }
}