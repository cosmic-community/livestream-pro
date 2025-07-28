'use client'

import { useState, useEffect, useCallback } from 'react'
import { SiteSettings, ApiResponse } from '@/types'

interface UseSiteSettingsReturn {
  settings: SiteSettings | null
  isLoading: boolean
  error: string | null
  refreshSettings: () => Promise<void>
  updateSettings: (settingsId: string, metadata: Partial<SiteSettings['metadata']>) => Promise<void>
  isMaintenanceMode: boolean
  isLiveChatEnabled: boolean
}

export function useSiteSettings(): UseSiteSettingsReturn {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshSettings = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/site-settings')
      const data: ApiResponse<SiteSettings> = await response.json()

      if (data.success && data.data) {
        setSettings(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch site settings')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch settings'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateSettings = useCallback(async (
    settingsId: string,
    metadata: Partial<SiteSettings['metadata']>
  ): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settingsId,
          metadata
        })
      })

      const data: ApiResponse<SiteSettings> = await response.json()

      if (data.success && data.data) {
        setSettings(data.data)
      } else {
        throw new Error(data.error || 'Failed to update site settings')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    refreshSettings()
  }, [refreshSettings])

  // Derived state
  const isMaintenanceMode = settings?.metadata.maintenance_mode || false
  const isLiveChatEnabled = settings?.metadata.livechat_enabled || false

  return {
    settings,
    isLoading,
    error,
    refreshSettings,
    updateSettings,
    isMaintenanceMode,
    isLiveChatEnabled
  }
}

// Hook for checking maintenance mode only
export function useMaintenanceMode() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch('/api/site-settings')
        const data = await response.json()

        if (data.success && data.data) {
          setIsMaintenanceMode(data.data.metadata.maintenance_mode || false)
          setMaintenanceMessage(data.data.metadata.maintenance_message || '')
        }
      } catch (error) {
        console.error('Failed to check maintenance mode:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkMaintenanceMode()

    // Check periodically
    const interval = setInterval(checkMaintenanceMode, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  return {
    isMaintenanceMode,
    maintenanceMessage,
    isLoading
  }
}

// Hook for LiveChat integration
export function useLiveChat() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [widgetId, setWidgetId] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadLiveChatSettings = async () => {
      try {
        const response = await fetch('/api/site-settings')
        const data = await response.json()

        if (data.success && data.data) {
          const { livechat_enabled, livechat_widget_id } = data.data.metadata
          setIsEnabled(livechat_enabled || false)
          setWidgetId(livechat_widget_id || '')
        }
      } catch (error) {
        console.error('Failed to load LiveChat settings:', error)
      }
    }

    loadLiveChatSettings()
  }, [])

  // Load LiveChat widget script
  useEffect(() => {
    if (!isEnabled || !widgetId || isLoaded) return

    const script = document.createElement('script')
    script.async = true
    script.src = `https://widget.livechatinc.com/livechat.js`
    
    script.onload = () => {
      setIsLoaded(true)
      
      // Initialize LiveChat with widget ID
      if (window.LC_API) {
        window.LC_API.init(widgetId)
      }
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(`script[src="${script.src}"]`)
      if (existingScript) {
        document.head.removeChild(existingScript)
      }
      setIsLoaded(false)
    }
  }, [isEnabled, widgetId, isLoaded])

  const openChat = useCallback(() => {
    if (window.LC_API && isLoaded) {
      window.LC_API.open_chat_window()
    }
  }, [isLoaded])

  const closeChat = useCallback(() => {
    if (window.LC_API && isLoaded) {
      window.LC_API.close_chat_window()
    }
  }, [isLoaded])

  const minimizeChat = useCallback(() => {
    if (window.LC_API && isLoaded) {
      window.LC_API.minimize_chat_window()
    }
  }, [isLoaded])

  return {
    isEnabled,
    widgetId,
    isLoaded,
    openChat,
    closeChat,
    minimizeChat
  }
}

// Global type declaration for LiveChat
declare global {
  interface Window {
    LC_API?: {
      init: (widgetId: string) => void
      open_chat_window: () => void
      close_chat_window: () => void
      minimize_chat_window: () => void
      on_chat_window_opened?: () => void
      on_chat_window_minimized?: () => void
      on_chat_window_hidden?: () => void
    }
  }
}