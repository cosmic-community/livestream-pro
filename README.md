# LiveStream Pro

![LiveStream Pro](https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=300&fit=crop&auto=format)

A professional personal live streaming platform that allows you to broadcast your webcam and screen share to viewers without requiring authentication. Built with Next.js 15, WebRTC, and Cosmic CMS.

## ✨ Features

- **Live Webcam Streaming** - High-quality webcam broadcasting
- **Screen Share Integration** - Stream your computer screen
- **Stream Controls** - Easy toggle controls for managing broadcasts  
- **No Viewer Authentication** - Public viewing without signup required
- **Real-time Status** - Live stream indicators and viewer count
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Stream Analytics** - Track viewer engagement and session data
- **Broadcast History** - View past streaming sessions

## Clone this Bucket and Code Repository

Want to create your own version of this project with all the content and structure? Clone this Cosmic bucket and code repository to get started instantly:

[![Clone this Bucket and Code Repository](https://img.shields.io/badge/Clone%20this%20Bucket-29abe2?style=for-the-badge&logo=cosmic&logoColor=white)](https://app.cosmic-staging.com/projects/new?clone_bucket=6883b34245a59f0b52cf886f&clone_repository=68877ef62dcc7fbc00c94dba)

## Prompts

This application was built using the following prompts to generate the content structure and code:

### Content Model Prompt

> I'm getting this error when building the application. Fix TypeScript error in LiveChat component by handling localStorage null return value. Can this be fixed with the content model?

### Code Generation Prompt

> Build a personal live streaming site for me to show my webcam and my computer screen. Allow me to turn on and off the live stream. Viewers of the screen do not need to log in to watch.

The app has been tailored to work with your existing Cosmic content structure and includes all the features requested above.

## 🛠️ Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Cosmic CMS** - Content management and analytics
- **WebRTC** - Real-time communication
- **Socket.io** - Real-time bidirectional communication
- **Peer.js** - WebRTC peer connections

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Cosmic account and bucket
- Modern web browser with WebRTC support

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up your environment variables:
   ```env
   COSMIC_BUCKET_SLUG=your-bucket-slug
   COSMIC_READ_KEY=your-read-key
   COSMIC_WRITE_KEY=your-write-key
   ```

4. Run the development server:
   ```bash
   bun dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📡 Cosmic SDK Examples

### Fetch Stream Analytics
```typescript
import { cosmic } from '@/lib/cosmic'

async function getStreamAnalytics() {
  try {
    const response = await cosmic.objects
      .find({ type: 'stream-sessions' })
      .props(['title', 'metadata'])
      .depth(1)
    
    return response.objects
  } catch (error) {
    if (error.status === 404) return []
    throw error
  }
}
```

### Create Stream Session
```typescript
async function createStreamSession(sessionData: {
  title: string
  startTime: string
  viewerCount: number
}) {
  const response = await cosmic.objects.insertOne({
    type: 'stream-sessions',
    title: sessionData.title,
    metadata: {
      start_time: sessionData.startTime,
      viewer_count: sessionData.viewerCount,
      status: 'live'
    }
  })
  
  return response.object
}
```

## 🌐 Cosmic CMS Integration

This application uses Cosmic CMS to manage:

- **Stream Sessions** - Track live and past streaming sessions
- **Viewer Analytics** - Monitor engagement and viewer statistics
- **Platform Settings** - Configure streaming preferences
- **Broadcast History** - Archive of all streaming sessions

The content structure includes object types for stream sessions, analytics data, and configuration settings, allowing you to track and manage your streaming platform through Cosmic's dashboard.

## 🚀 Deployment Options

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically with each push

### Netlify
1. Build the application: `bun run build`
2. Deploy the `dist` folder to Netlify
3. Set environment variables in Netlify dashboard

### Environment Variables for Production

Set these in your hosting platform's dashboard:
- `COSMIC_BUCKET_SLUG` - Your Cosmic bucket slug
- `COSMIC_READ_KEY` - Your Cosmic read key  
- `COSMIC_WRITE_KEY` - Your Cosmic write key

<!-- README_END -->