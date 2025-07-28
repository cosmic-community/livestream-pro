import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LiveStream Pro - Personal Broadcasting Platform',
  description: 'High-quality webcam and screen sharing live streaming platform with real-time viewer engagement.',
  keywords: ['live streaming', 'webcam', 'screen share', 'broadcasting', 'video streaming'],
  authors: [{ name: 'LiveStream Pro' }],
  openGraph: {
    title: 'LiveStream Pro - Personal Broadcasting Platform',
    description: 'High-quality webcam and screen sharing live streaming platform with real-time viewer engagement.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LiveStream Pro - Personal Broadcasting Platform',
    description: 'High-quality webcam and screen sharing live streaming platform with real-time viewer engagement.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}