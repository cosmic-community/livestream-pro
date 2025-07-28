import { Suspense } from 'react'
import Link from 'next/link'
import StreamPlayer from '@/components/StreamPlayer'
import ViewerCount from '@/components/ViewerCount'
import StreamStatus from '@/components/StreamStatus'
import StreamHistory from '@/components/StreamHistory'
import { getStreamSession, getStreamSessions } from '@/lib/cosmic'

export default async function HomePage() {
  // Get current active stream session
  const streamSessions = await getStreamSessions(1)
  const activeSession = streamSessions?.[0] || null

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
                href="/streamer"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Streamer Access
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
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
                <p className="text-muted-foreground mb-4">
                  There is currently no live stream. Check back later or view previous streams below.
                </p>
                <Link
                  href="/streamer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Start Streaming
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Stream History */}
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-4">Recent Streams</h3>
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
                  Watch live webcam and screen sharing sessions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}