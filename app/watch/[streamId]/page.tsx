// app/watch/[streamId]/page.tsx
import { Suspense } from 'react'
import { Metadata } from 'next'
import PublicViewer from '@/components/PublicViewer'
import LiveChat from '@/components/LiveChat'
import { getStreamSession, getSiteSettings } from '@/lib/cosmic'
import { StreamSession, SiteSettings } from '@/types'

interface PageProps {
  params: Promise<{ streamId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { streamId } = await params
  
  try {
    const session = await getStreamSession(streamId)
    
    if (!session) {
      return {
        title: 'Stream Not Found - LiveStream Pro',
        description: 'The requested stream could not be found.'
      }
    }

    return {
      title: `${session.title} - LiveStream Pro`,
      description: session.metadata.description || 'Watch live stream on LiveStream Pro',
      openGraph: {
        title: session.title,
        description: session.metadata.description || 'Watch live stream on LiveStream Pro',
        type: 'video.other',
        images: session.metadata.thumbnail ? [
          {
            url: `${session.metadata.thumbnail.imgix_url}?w=1200&h=630&fit=crop&auto=format,compress`,
            width: 1200,
            height: 630,
            alt: session.title
          }
        ] : []
      },
      twitter: {
        card: 'summary_large_image',
        title: session.title,
        description: session.metadata.description || 'Watch live stream on LiveStream Pro'
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Stream - LiveStream Pro',
      description: 'Watch live streams on LiveStream Pro'
    }
  }
}

async function StreamViewerPage({ params }: PageProps) {
  const { streamId } = await params
  
  try {
    const [session, siteSettings] = await Promise.all([
      getStreamSession(streamId),
      getSiteSettings()
    ])

    if (!session) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Stream Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The stream you're looking for doesn't exist or has been removed.
            </p>
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      )
    }

    // Check maintenance mode
    if (siteSettings?.metadata.maintenance_mode) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4">🔧</div>
            <h1 className="text-2xl font-bold text-foreground mb-4">Maintenance Mode</h1>
            <div 
              className="text-muted-foreground"
              dangerouslySetInnerHTML={{ 
                __html: siteSettings.metadata.maintenance_message || 
                        '<p>We\'re currently performing maintenance. Please check back later.</p>' 
              }}
            />
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <a 
                  href="/"
                  className="text-xl font-bold text-foreground hover:text-blue-400 transition-colors"
                >
                  ← LiveStream Pro
                </a>
                <div className="text-muted-foreground">|</div>
                <h1 className="text-xl font-semibold text-foreground truncate">
                  {session.title}
                </h1>
              </div>
              
              {/* Stream Status */}
              <div className="flex items-center gap-2">
                {session.metadata.status === 'live' && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-white text-sm font-medium">LIVE</span>
                  </div>
                )}
                {session.metadata.status === 'ended' && (
                  <div className="px-3 py-1 bg-gray-600 rounded-full">
                    <span className="text-white text-sm font-medium">ENDED</span>
                  </div>
                )}
                {session.metadata.status === 'scheduled' && (
                  <div className="px-3 py-1 bg-blue-600 rounded-full">
                    <span className="text-white text-sm font-medium">SCHEDULED</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Video Player */}
            <div className="lg:col-span-3">
              <PublicViewer 
                session={session}
                siteSettings={siteSettings}
              />
            </div>

            {/* Sidebar - Chat and Info */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Stream Info */}
                <div className="bg-muted/30 rounded-lg p-6">
                  <h3 className="font-semibold text-foreground mb-3">Stream Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`font-medium ${
                        session.metadata.status === 'live' ? 'text-red-400' :
                        session.metadata.status === 'ended' ? 'text-gray-400' :
                        session.metadata.status === 'scheduled' ? 'text-blue-400' :
                        'text-muted-foreground'
                      }`}>
                        {session.metadata.status.charAt(0).toUpperCase() + session.metadata.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Viewers</span>
                      <span className="font-medium text-foreground">
                        {session.metadata.viewer_count.toLocaleString()}
                      </span>
                    </div>
                    {session.metadata.category && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category</span>
                        <span className="font-medium text-foreground">{session.metadata.category}</span>
                      </div>
                    )}
                    {session.metadata.started_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Started</span>
                        <span className="font-medium text-foreground">
                          {new Date(session.metadata.started_at).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {session.metadata.description && (
                  <div className="bg-muted/30 rounded-lg p-6">
                    <h3 className="font-semibold text-foreground mb-3">Description</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {session.metadata.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {session.metadata.tags && session.metadata.tags.length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-6">
                    <h3 className="font-semibold text-foreground mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {session.metadata.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* LiveChat Integration */}
                {siteSettings?.metadata.livechat_enabled && (
                  <LiveChat 
                    widgetId={siteSettings.metadata.livechat_widget_id}
                    streamId={streamId}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading stream viewer page:', error)
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Error Loading Stream</h1>
          <p className="text-muted-foreground mb-6">
            We encountered an error while loading the stream. Please try again later.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    )
  }
}

export default function Page({ params }: PageProps) {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading stream...</p>
          </div>
        </div>
      }
    >
      <StreamViewerPage params={params} />
    </Suspense>
  )
}