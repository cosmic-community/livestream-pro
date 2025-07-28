import { Eye, Users } from 'lucide-react'
import { ViewerCountProps } from '@/types'

export default function ViewerCount({ count, isLive }: ViewerCountProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Live Indicator */}
      {isLive && (
        <div className="status-indicator status-live">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse-red"></div>
          <span>LIVE</span>
        </div>
      )}

      {/* Viewer Count */}
      <div className="viewer-count">
        <Users className="w-4 h-4" />
        <span>{count.toLocaleString()}</span>
        <span className="text-xs text-gray-300">
          {count === 1 ? 'viewer' : 'viewers'}
        </span>
      </div>
    </div>
  )
}