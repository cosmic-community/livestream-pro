import { Circle, Clock } from 'lucide-react'
import { StreamStatusProps } from '@/types'
import { formatDuration } from '@/lib/streaming'

export default function StreamStatus({ status, duration }: StreamStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'text-red-400 bg-red-500/20 border-red-500/30'
      case 'scheduled':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'ended':
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
      case 'error':
        return 'text-red-400 bg-red-500/20 border-red-500/30'
      default:
        return 'text-muted-foreground bg-muted border-border'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live':
        return 'Live'
      case 'scheduled':
        return 'Scheduled'
      case 'ended':
        return 'Ended'
      case 'error':
        return 'Error'
      default:
        return 'Offline'
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* Status Badge */}
      <div className={`status-indicator ${getStatusColor(status)}`}>
        <Circle className={`w-2 h-2 fill-current ${status === 'live' ? 'animate-pulse-red' : ''}`} />
        <span className="font-medium">{getStatusText(status)}</span>
      </div>

      {/* Duration */}
      {status === 'live' && duration > 0 && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{formatDuration(duration)}</span>
        </div>
      )}
    </div>
  )
}