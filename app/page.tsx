import StreamPlayer from '@/components/StreamPlayer'
import StreamControls from '@/components/StreamControls'
import ViewerCount from '@/components/ViewerCount'
import StreamStatus from '@/components/StreamStatus'
import StreamHistory from '@/components/StreamHistory'
import { getStreamSession, getPlatformSettings } from '@/lib/cosmic'

export default async function HomePage() {
  const activeSession = await getStreamSession('active') // Fixed function name
  const settings = await getPlatformSettings()
  
  const isLive = activeSession?.metadata.status === 'live'
  const streamTitle = settings?.metadata.stream_title || 'Live Stream'
  const streamDescription = settings?.metadata.stream_description || 'Welcome to my live stream!'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-foreground">LiveStream Pro</h1>
              <StreamStatus 
                status={isLive ? 'live' : 'offline'} 
                duration={0} 
              />
            </div>
            <ViewerCount 
              count={activeSession?.metadata.viewer_count || 0}
              isLive={isLive}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Video Player - Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Stream Info */}
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-foreground">{streamTitle}</h2>
                <p className="text-muted-foreground">{streamDescription}</p>
              </div>

              {/* Video Player */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <StreamPlayer 
                  streamId={activeSession?.id}
                  isStreamer={false}
                />
              </div>

              {/* Stream Controls - Now properly handles viewer mode */}
              <StreamControls 
                isStreaming={isLive}
                viewerMode={true}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-4">Stream Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-medium ${isLive ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {isLive ? 'Live' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Viewers</span>
                    <span className="font-medium text-foreground">
                      {activeSession?.metadata.viewer_count || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peak</span>
                    <span className="font-medium text-foreground">
                      {activeSession?.metadata.peak_viewers || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stream History */}
              <StreamHistory />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}