'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

export default function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    try {
      // Force a page refresh to get latest stream data
      window.location.reload()
    } catch (error) {
      console.error('Error refreshing:', error)
      setIsRefreshing(false)
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="px-4 py-2 border border-border hover:bg-muted/50 text-foreground rounded-lg font-medium transition-colors inline-flex items-center gap-2 disabled:opacity-50"
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </button>
  )
}