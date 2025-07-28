import { Suspense } from 'react'
import Link from 'next/link'
import { getStreamSessions, getSiteSettings } from '@/lib/cosmic'
import StreamDirectory from '@/components/StreamDirectory'
import MaintenanceMode from '@/components/MaintenanceMode'
import { Eye, Clock, Calendar, ArrowRight } from 'lucide-react'

export default async function WatchPage() {
  let siteSettings = null
  let allStreams: any[] = []

  try {
    // Check for maintenance mode with proper error handling
    siteSettings = await getSiteSettings()
  } catch (error) {
    console.log('Site settings not available during build:', error)
    // Continue without site settings during build
  }
  
  if (siteSettings?.metadata.maintenance_mode) {
    return <MaintenanceMode siteSettings={siteSettings} />
  }

  try {
    // Get all streams with proper error handling
    allStreams = await getStreamSessions(20)
  } catch (error) {
    console.log('Stream sessions not available during build:', error)
    // Continue with empty streams array during build
  }

  const liveStreams = allStreams.filter(stream => stream.metadata?.status === 'live')
  const scheduledStreams = allStreams.filter(stream => stream.metadata?.status === 'scheduled')
  const recentStreams = allStreams.filter(stream => stream.metadata?.status === 'ended').slice(0, 6)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-foreground hover:text-foreground/80 transition-colors">
                LiveStream Pro
              </Link>
              <span className="text-muted-foreground">•</span>
              <h1 className="text-lg font-medium text-muted-foreground">Watch Streams</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link
                href="/streamer"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Start Streaming
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Live Streams Section */}
        {liveStreams.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <h2 className="text-2xl font-bold text-foreground">Live Now</h2>
              </div>
              <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                {liveStreams.length} stream{liveStreams.length !== 1 ? 's' : ''}
              </span>
            </div>

            <Suspense fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-muted/30 rounded-lg h-64"></div>
                ))}
              </div>
            }>
              <StreamDirectory streams={liveStreams} priority />
            </Suspense>
          </section>
        )}

        {/* No Live Streams */}
        {liveStreams.length === 0 && (
          <section className="mb-12">
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">No Live Streams</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                There are currently no active live streams. Check back later or start your own stream!
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/streamer"
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  Start Streaming
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <RefreshButton />
              </div>
            </div>
          </section>
        )}

        {/* Scheduled Streams Section */}
        {scheduledStreams.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-foreground">Scheduled Streams</h2>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                {scheduledStreams.length} scheduled
              </span>
            </div>

            <Suspense fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-muted/30 rounded-lg h-64"></div>
                ))}
              </div>
            }>
              <StreamDirectory streams={scheduledStreams} />
            </Suspense>
          </section>
        )}

        {/* Recent Streams Section */}
        {recentStreams.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-muted-foreground" />
              <h2 className="text-2xl font-bold text-foreground">Recent Streams</h2>
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">
                {recentStreams.length} recent
              </span>
            </div>

            <Suspense fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-muted/30 rounded-lg h-64"></div>
                ))}
              </div>
            }>
              <StreamDirectory streams={recentStreams} />
            </Suspense>

            <div className="text-center mt-8">
              <Link
                href="/"
                className="px-6 py-3 border border-border hover:bg-muted/50 text-foreground rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                View All History
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

        {/* Empty State - No Streams at All */}
        {allStreams.length === 0 && (
          <section>
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Welcome to LiveStream Pro</h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                This is your personal live streaming platform. No streams have been created yet. 
                Start your first stream to begin broadcasting!
              </p>
              <Link
                href="/streamer"
                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-lg transition-colors inline-flex items-center gap-3"
              >
                Create Your First Stream
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* Quick Access Footer */}
      <footer className="border-t border-border bg-muted/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              LiveStream Pro - Personal Broadcasting Platform
            </p>
            <div className="flex items-center justify-center gap-6">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link
                href="/streamer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Start Streaming
              </Link>
              <Link
                href="/watch"
                className="text-sm text-foreground font-medium"
              >
                Watch Streams
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Client component for refresh functionality
function RefreshButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="px-6 py-3 border border-border hover:bg-muted/50 text-foreground rounded-lg font-medium transition-colors"
    >
      Refresh
    </button>
  )
}