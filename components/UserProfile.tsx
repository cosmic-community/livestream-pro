'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { User } from '@/types'

interface UserProfileProps {
  editable?: boolean
  compact?: boolean
}

export default function UserProfile({ editable = false, compact = false }: UserProfileProps) {
  const { user, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: user?.metadata.username || '',
    bio: user?.metadata.bio || '',
    social_links: user?.metadata.social_links || {},
  })

  if (!user) {
    return (
      <div className="bg-muted/30 rounded-lg p-6">
        <p className="text-muted-foreground">User profile not available</p>
      </div>
    )
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          bio: formData.bio,
          social_links: formData.social_links,
        }),
      })

      const data = await response.json()

      if (data.success) {
        await refreshUser()
        setIsEditing(false)
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      username: user.metadata.username || '',
      bio: user.metadata.bio || '',
      social_links: user.metadata.social_links || {},
    })
    setIsEditing(false)
    setError(null)
  }

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value
      }
    }))
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {user.metadata.profile_image?.imgix_url && (
          <img
            src={`${user.metadata.profile_image.imgix_url}?w=80&h=80&fit=crop&auto=format,compress`}
            alt={user.metadata.username}
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <div>
          <p className="font-medium text-foreground">{user.metadata.username}</p>
          <p className="text-sm text-muted-foreground">{user.metadata.email}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted/30 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Profile</h3>
        {editable && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Image */}
        <div className="flex items-center gap-4">
          {user.metadata.profile_image?.imgix_url ? (
            <img
              src={`${user.metadata.profile_image.imgix_url}?w=160&h=160&fit=crop&auto=format,compress`}
              alt={user.metadata.username}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl text-muted-foreground">
                {user.metadata.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h4 className="font-medium text-foreground">{user.metadata.username}</h4>
            <p className="text-sm text-muted-foreground">{user.metadata.email}</p>
            {user.metadata.account_status && (
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                user.metadata.account_status.key === 'active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
              }`}>
                {user.metadata.account_status.value}
              </span>
            )}
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Username</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              disabled={isLoading}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          ) : (
            <p className="text-foreground">{user.metadata.username}</p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
          {isEditing ? (
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              disabled={isLoading}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
              placeholder="Tell viewers about yourself..."
            />
          ) : (
            <p className="text-foreground">{user.metadata.bio || 'No bio provided'}</p>
          )}
        </div>

        {/* Stream Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-background rounded-lg">
            <p className="text-2xl font-bold text-foreground">{user.metadata.follower_count || 0}</p>
            <p className="text-sm text-muted-foreground">Followers</p>
          </div>
          <div className="text-center p-3 bg-background rounded-lg">
            <p className="text-2xl font-bold text-foreground">{user.metadata.total_views || 0}</p>
            <p className="text-sm text-muted-foreground">Total Views</p>
          </div>
        </div>

        {/* Social Links */}
        {(isEditing || Object.keys(user.metadata.social_links || {}).length > 0) && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Social Links</label>
            <div className="space-y-3">
              {['twitter', 'youtube', 'discord', 'instagram', 'twitch'].map((platform) => (
                <div key={platform} className="flex items-center gap-3">
                  <span className="w-20 text-sm text-muted-foreground capitalize">{platform}:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.social_links[platform] || ''}
                      onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                      disabled={isLoading}
                      className="flex-1 px-3 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                      placeholder={`Your ${platform} handle or URL`}
                    />
                  ) : (
                    <span className="flex-1 text-sm text-foreground">
                      {user.metadata.social_links?.[platform] || 'Not provided'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stream Key (for authenticated user only) */}
        {user.metadata.personal_stream_key && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Stream Key</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm font-mono">
                {user.metadata.personal_stream_key}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(user.metadata.personal_stream_key)}
                className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Keep this private. This key is used to authenticate your streams.
            </p>
          </div>
        )}

        {/* Action Buttons for Editing */}
        {isEditing && (
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}