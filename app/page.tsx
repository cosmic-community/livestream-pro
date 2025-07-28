import { Suspense } from 'react'
import Link from 'next/link'
import StreamPlayer from '@/components/StreamPlayer'
import ViewerCount from '@/components/ViewerCount'
import StreamStatus from '@/components/StreamStatus'
import StreamHistory from '@/components/StreamHistory'
import { getStreamSession, getStreamSessions, getSiteSettings } from '@/lib/cosmic'
import MaintenanceMode from '@/components/MaintenanceMode'
import { Play, Eye, Calendar } from 'lucide-react'

export default async function HomePage() {
  // Check for maintenance mode
  const siteSettings = await getSiteSettings()
  
  if (siteSettings?.metadata.maintenance_mode) {
    return <MaintenanceMode siteSettings={siteSettings} />
  }

  // Get current active stream session
  const streamSessions = await getStreamSessions(1)
  const activeSession = streamSessions?.[0] || null

  // Get recent streams for homepage
  const recentStreams = await getStreamSessions(5)
  const liveStreams = recentStreams.filter(stream => stream.metadata.status === 'live')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-foreground">LiveStream Pro</h1>
              {activeSession && (
                <StreamStatus 
                  status={activeSession.metadata?.status || 'offline'} 
                  duration={activeSession.metadata?.duration || 0} 
                />
              )}
            </div>
            <div className="flex items-center gap-4">
              <ViewerCount 
                count={activeSession?.metadata?.viewer_count || 0}
                isLive={activeSession?.metadata?.status === 'live'}
              />
              <Link
                href="/watch"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Watch Streams
              </Link>
              <Link
                href="/streamer"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Streamer Access
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Quick Access */}
      <div className="container mx-auto px-4 py-8">
        {liveStreams.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <h2 className="text-xl font-bold text-foreground">Live Now!</h2>
                </div>
                <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                  {liveStreams.length} stream{liveStreams.length !== 1 ? 's' : ''}
                </span>
              </div>
              <Link
                href="/watch"
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Watch Live
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Stream Player */}
          <div className="lg:col-span-2">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-white text-sm">Loading stream...</p>
                  </div>
                </div>
              }>
                <StreamPlayer 
                  isStreamer={false}
                  activeSession={activeSession}
                />
              </Suspense>
            </div>

            {/* Stream Info */}
            {activeSession && (
              <div className="mt-6 bg-muted/30 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {activeSession.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Started: {new Date(activeSession.created_at).toLocaleString()}</span>
                  <span>Type: {activeSession.metadata?.stream_type || 'webcam'}</span>
                  <span>Quality: {activeSession.metadata?.quality || 'auto'}</span>
                </div>
              </div>
            )}

            {/* No Active Stream */}
            {!activeSession && (
              <div className="mt-6 bg-muted/30 rounded-lg p-8 text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  No Active Stream
                </h2>
                <p className="text-muted-foreground mb-6">
                  There is currently no live stream. Check out available streams or start your own!
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Link
                    href="/watch"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Browse Streams
                  </Link>
                  <Link
                    href="/streamer"
                    className="inline-flex items-center px-6 py-3 border border-border hover:bg-muted/50 text-foreground rounded-lg font-medium transition-colors gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Streaming
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Quick Access */}
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-4">Quick Access</h3>
                <div className="space-y-3">
                  <Link
                    href="/watch"
                    className="w-full flex items-center gap-3 p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30 rounded-lg transition-colors group"
                  >
                    <Eye className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="font-medium text-foreground group-hover:text-blue-400 transition-colors">
                        Watch Streams
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Browse all available streams
                      </div>
                    </div>
                  </Link>
                  
                  <Link
                    href="/streamer"
                    className="w-full flex items-center gap-3 p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-colors group"
                  >
                    <Play className="w-5 h-5 text-red-400" />
                    <div>
                      <div className="font-medium text-foreground group-hover:text-red-400 transition-colors">
                        Start Streaming
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Begin your own broadcast
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Stream History */}
              <div className="bg-muted/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Recent Streams</h3>
                  <Link
                    href="/watch"
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View All
                  </Link>
                </div>
                <Suspense fallback={
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                }>
                  <StreamHistory limit={5} />
                </Suspense>
              </div>

              {/* Platform Info */}
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-4">About</h3>
                <p className="text-sm text-muted-foreground">
                  Welcome to LiveStream Pro - a personal live streaming platform. 
                  Watch live webcam and screen sharing sessions, or start your own broadcast.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}