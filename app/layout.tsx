import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import CosmicBadge from '@/components/CosmicBadge'
import { AuthProvider } from '@/hooks/useAuth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LiveStream Pro - Personal Live Streaming Platform',
  description: 'Stream your webcam and screen to viewers with authentication. Built with Next.js and Cosmic CMS.',
  keywords: 'live streaming, webcam, screen share, broadcast, real-time, authentication',
  authors: [{ name: 'LiveStream Pro' }],
  openGraph: {
    title: 'LiveStream Pro - Personal Live Streaming Platform',
    description: 'Stream your webcam and screen to viewers with authentication.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LiveStream Pro',
    description: 'Personal live streaming platform with webcam and screen sharing.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const bucketSlug = process.env.COSMIC_BUCKET_SLUG as string

  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <main className="min-h-screen bg-background">
            {children}
          </main>
        </AuthProvider>
        <CosmicBadge bucketSlug={bucketSlug} />
      </body>
    </html>
  )
}