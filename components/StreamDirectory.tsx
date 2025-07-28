import Link from 'next/link'
import { Eye, Calendar, Clock, Play, Users, Tv } from 'lucide-react'
import { StreamSession } from '@/types'

interface StreamDirectoryProps {
  streams: StreamSession[]
  priority?: boolean
}

export default function StreamDirectory({ streams, priority = false }: StreamDirectoryProps) {
  if (streams.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No streams available</p>
      </div>
    )
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-500 text-white'
      case 'scheduled':
        return 'bg-blue-500 text-white'
      case 'ended':
        return 'bg-gray-500 text-white'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
      case 'scheduled':
        return <Calendar className="w-3 h-3" />
      case 'ended':
        return <Clock className="w-3 h-3" />
      default:
        return <Tv className="w-3 h-3" />
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {streams.map((stream) => (
        <Link
          key={stream.id}
          href={`/watch/${stream.id}`}
          className="group block bg-muted/30 hover:bg-muted/50 rounded-lg overflow-hidden border border-border hover:border-border/60 transition-all duration-200"
        >
          {/* Thumbnail */}
          <div className="relative aspect-video bg-black">
            {stream.metadata?.thumbnail ? (
              <img
                src={`${stream.metadata.thumbnail}?w=800&h=450&fit=crop&auto=format,compress`}
                alt={stream.metadata?.title || stream.title}
                className="w-full h-full object-cover"
                loading={priority ? 'eager' : 'lazy'}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <Tv className="w-12 h-12 text-gray-400" />
              </div>
            )}
            
            {/* Status Overlay */}
            <div className="absolute top-3 left-3">
              <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stream.metadata?.status || 'unknown')}`}>
                {getStatusIcon(stream.metadata?.status || 'unknown')}
                <span className="capitalize">{stream.metadata?.status || 'unknown'}</span>
              </div>
            </div>

            {/* Viewer Count for Live Streams */}
            {stream.metadata?.status === 'live' && stream.metadata?.viewer_count !== undefined && (
              <div className="absolute top-3 right-3">
                <div className="flex items-center gap-1 px-2 py-1 bg-black/70 rounded-full text-white text-xs">
                  <Users className="w-3 h-3" />
                  <span>{stream.metadata.viewer_count.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
              <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                <Play className="w-7 h-7 text-gray-900 ml-1" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-foreground group-hover:text-foreground/80 line-clamp-2 mb-2">
              {stream.metadata?.title || stream.title}
            </h3>
            
            {stream.metadata?.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {stream.metadata.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                {/* Date */}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(stream.created_at)}</span>
                </div>

                {/* Duration for ended streams */}
                {stream.metadata?.status === 'ended' && stream.metadata?.duration && stream.metadata.duration > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(stream.metadata.duration)}</span>
                  </div>
                )}
              </div>

              {/* Stream Type */}
              {stream.metadata?.stream_type && (
                <span className="capitalize px-2 py-1 bg-muted rounded text-xs">
                  {stream.metadata.stream_type}
                </span>
              )}
            </div>

            {/* Tags */}
            {stream.metadata?.tags && stream.metadata.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {stream.metadata.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
                {stream.metadata.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{stream.metadata.tags.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Category */}
            {stream.metadata?.category && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                  {stream.metadata.category}
                </span>
              </div>
            )}

            {/* Peak Viewers for ended streams */}
            {stream.metadata?.status === 'ended' && stream.metadata?.peak_viewers && stream.metadata.peak_viewers > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Eye className="w-3 h-3" />
                <span>Peak: {stream.metadata.peak_viewers.toLocaleString()} viewers</span>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}