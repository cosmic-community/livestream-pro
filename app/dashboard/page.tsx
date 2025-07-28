'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import AuthGuard from '@/components/AuthGuard'
import UserProfile from '@/components/UserProfile'
import StreamAnalytics from '@/components/StreamAnalytics'
import StreamHistory from '@/components/StreamHistory'

function DashboardContent() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="text-xl font-bold text-foreground hover:text-blue-400 transition-colors"
              >
                LiveStream Pro
              </Link>
              <div className="text-muted-foreground">|</div>
              <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <UserProfile compact />
              <button
                onClick={logout}
                className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Welcome Section */}
            <div className="bg-muted/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome back, {user.metadata.username}!
              </h2>
              <p className="text-muted-foreground mb-6">
                Ready to go live? Manage your streams and connect with your audience.
              </p>
              
              <div className="flex gap-4">
                <Link
                  href="/streamer"
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Start Streaming
                </Link>
                <Link
                  href="/watch"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Browse Streams
                </Link>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/30 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-foreground mb-2">
                  {user.metadata.follower_count || 0}
                </div>
                <div className="text-muted-foreground">Followers</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-foreground mb-2">
                  {user.metadata.total_views || 0}
                </div>
                <div className="text-muted-foreground">Total Views</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-6 text-center">
                <div className={`text-3xl font-bold mb-2 ${user.metadata.is_live ? 'text-red-400' : 'text-muted-foreground'}`}>
                  {user.metadata.is_live ? 'LIVE' : 'OFFLINE'}
                </div>
                <div className="text-muted-foreground">Status</div>
              </div>
            </div>

            {/* Stream Analytics */}
            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Stream Analytics</h3>
              <StreamAnalytics />
            </div>

            {/* Recent Streams */}
            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Streams</h3>
              <StreamHistory limit={5} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <UserProfile editable />

            {/* Quick Actions */}
            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/streamer"
                  className="block w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-center rounded-lg font-medium transition-colors"
                >
                  Go Live
                </Link>
                <Link
                  href="/profile"
                  className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg font-medium transition-colors"
                >
                  Edit Profile
                </Link>
                <Link
                  href="/watch"
                  className="block w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-center rounded-lg font-medium transition-colors"
                >
                  Browse Streams
                </Link>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">Account Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium ${
                    user.metadata.account_status?.key === 'active' 
                      ? 'text-green-400' 
                      : 'text-yellow-400'
                  }`}>
                    {user.metadata.account_status?.value || 'Active'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium text-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currently</span>
                  <span className={`font-medium ${user.metadata.is_live ? 'text-red-400' : 'text-muted-foreground'}`}>
                    {user.metadata.is_live ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}