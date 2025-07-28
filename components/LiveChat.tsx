'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react'

interface LiveChatProps {
  widgetId: string
  streamId?: string
  className?: string
}

export default function LiveChat({ widgetId, streamId, className = '' }: LiveChatProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only load LiveChat if widgetId is provided and not empty
    if (!widgetId || widgetId.trim() === '') {
      setError('LiveChat widget ID not configured')
      return
    }

    const loadLiveChat = async () => {
      try {
        // Check if LiveChat is already loaded
        if ((window as any).__lc) {
          setIsLoaded(true)
          return
        }

        // Create LiveChat script
        const script = document.createElement('script')
        script.async = true
        script.src = 'https://widget.livechatinc.com/gtm/livechat.js'
        
        script.onload = () => {
          // Initialize LiveChat
          ;(window as any).__lc = (window as any).__lc || {}
          ;(window as any).__lc.license = widgetId
          
          // Optional: Add custom visitor info if streamId is available
          if (streamId) {
            ;(window as any).__lc.visitor = {
              name: `Stream Viewer`,
              email: `viewer-${streamId}@stream.local`,
              phone: '',
              customProperties: [
                {
                  name: 'Stream ID',
                  value: streamId
                },
                {
                  name: 'Page Type',
                  value: 'Stream Viewer'
                },
                {
                  name: 'Viewing Time',
                  value: new Date().toISOString()
                }
              ]
            }
          }

          // Load the widget
          const lcScript = document.createElement('script')
          lcScript.async = true
          lcScript.src = `https://widget.livechatinc.com/gtm/livechat.js?license=${widgetId}`
          document.head.appendChild(lcScript)
          
          setIsLoaded(true)
          setError(null)
        }

        script.onerror = () => {
          setError('Failed to load LiveChat widget')
        }

        document.head.appendChild(script)
      } catch (err) {
        console.error('Error loading LiveChat:', err)
        setError('Error initializing LiveChat')
      }
    }

    loadLiveChat()

    // Cleanup function
    return () => {
      // Note: LiveChat doesn't provide an easy way to completely unload
      // In a real implementation, you might want to handle this differently
    }
  }, [widgetId, streamId])

  // Don't render if no widget ID or if there's an error
  if (!widgetId || widgetId.trim() === '' || error) {
    return null
  }

  return (
    <div className={`bg-muted/30 rounded-lg overflow-hidden ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-foreground">Live Chat</h3>
          {isLoaded && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            title={isMinimized ? 'Expand chat' : 'Minimize chat'}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Chat Content */}
      {!isMinimized && (
        <div className="h-96 bg-background/50">
          {!isLoaded ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-muted-foreground text-sm">Loading chat...</p>
              </div>
            </div>
          ) : (
            <div className="h-full p-4">
              {/* LiveChat widget will automatically inject itself here */}
              <div className="text-center text-muted-foreground text-sm">
                <p>💬 Chat with other viewers and the streamer!</p>
                <p className="mt-2 text-xs">
                  The LiveChat widget should appear shortly.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback UI when minimized */}
      {isMinimized && (
        <div className="p-3 text-center">
          <p className="text-muted-foreground text-sm">Chat minimized</p>
        </div>
      )}
    </div>
  )
}