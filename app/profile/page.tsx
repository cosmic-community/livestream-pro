'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import AuthGuard from '@/components/AuthGuard'
import UserProfile from '@/components/UserProfile'

function ProfileContent() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile')

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="text-xl font-bold text-foreground hover:text-blue-400 transition-colors"
              >
                ← Dashboard
              </Link>
              <div className="text-muted-foreground">|</div>
              <h1 className="text-xl font-semibold text-foreground">Profile Settings</h1>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-muted/30 rounded-lg p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'profile' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-foreground hover:bg-muted/50'
                  }`}
                >
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'security' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-foreground hover:bg-muted/50'
                  }`}
                >
                  Security
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'preferences' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-foreground hover:bg-muted/50'
                  }`}
                >
                  Preferences
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Profile Information</h2>
                  <p className="text-muted-foreground mb-6">
                    Manage your public profile information and social media links.
                  </p>
                </div>
                <UserProfile editable />
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Security Settings</h2>
                  <p className="text-muted-foreground mb-6">
                    Manage your password and account security.
                  </p>
                </div>
                <SecuritySettings />
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Preferences</h2>
                  <p className="text-muted-foreground mb-6">
                    Customize your streaming and notification preferences.
                  </p>
                </div>
                <PreferencesSettings />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SecuritySettings() {
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setIsChangingPassword(false)
      } else {
        setError(data.error || 'Failed to update password')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Password</h3>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Change Password
            </button>
          )}
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200 text-sm">Password updated successfully!</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {isChangingPassword ? (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                required
                minLength={8}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                minLength={8}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false)
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  setError(null)
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="text-muted-foreground">••••••••••••</p>
        )}
      </div>
    </div>
  )
}

function PreferencesSettings() {
  return (
    <div className="space-y-6">
      <div className="bg-muted/30 rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-4">Stream Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Auto-start recording</label>
              <p className="text-xs text-muted-foreground">Automatically record streams when you go live</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Chat notifications</label>
              <p className="text-xs text-muted-foreground">Get notified of new chat messages</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-4">Privacy Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Public profile</label>
              <p className="text-xs text-muted-foreground">Allow others to view your profile and stats</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Analytics tracking</label>
              <p className="text-xs text-muted-foreground">Allow collection of viewing analytics</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  )
}