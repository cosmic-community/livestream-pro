'use client'

export default function RefreshButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="px-6 py-3 border border-border hover:bg-muted/50 text-foreground rounded-lg font-medium transition-colors"
    >
      Refresh
    </button>
  )
}