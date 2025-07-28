'use client'

import { RefreshCw } from 'lucide-react'

export default function RefreshButton() {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <button
      onClick={handleRefresh}
      className="px-4 py-2 border border-border hover:bg-muted/50 text-foreground rounded-lg font-medium transition-colors inline-flex items-center gap-2"
    >
      <RefreshCw className="w-4 h-4" />
      Refresh
    </button>
  )
}