'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Streamer } from '@/lib/cms-types'
import { Users, Eye, Play, UserCheck, ExternalLink } from 'lucide-react'

interface StreamerCardProps {
  streamer: Streamer
  showStats?: boolean
  showBio?: boolean
  showSocialLinks?: boolean
  showFollowButton?: boolean
  compact?: boolean
  className?: string
}

export default function StreamerCard({
  streamer,
  showStats = true,
  showBio = true,
  showSocialLinks = false,
  showFollowButton = false,
  compact = false,
  className = ''
}: StreamerCardProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsFollowLoading(true)
    
    try {
      // Simulate follow/unfollow API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsFollowing(!isFollowing)
    } catch (error) {
      console.error('Failed to toggle follow:', error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'suspended':
        return 'bg-yellow-500'
      case 'banned':
        return 'bg-red-500'
      case 'pending':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  if (compact) {
    return (
      <Link
        href={`/streamer/${streamer.slug}`}
        className={`flex items-center gap-3 p-3 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border hover:border-border/60 transition-all duration-200 ${className}`}
      >
        <div className="relative">
          {streamer.metadata.profile_image?.imgix_url ? (
            <img
              src={`${streamer.metadata.profile_image.imgix_url}?w=80&h=80&fit=crop&auto=format,compress`}
              alt={streamer.metadata.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {streamer.metadata.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Live indicator */}
          {streamer.metadata.is_live && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-background flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground truncate">{streamer.metadata.username}</h4>
            {streamer.metadata.is_live && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {formatNumber(streamer.metadata.follower_count)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatNumber(streamer.metadata.total_views)}
            </span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className={`bg-muted/30 rounded-lg border border-border overflow-hidden transition-all duration-200 hover:border-border/60 hover:shadow-lg ${className}`}>
      {/* Header with profile image and status */}
      <div className="relative">
        <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          {streamer.metadata.profile_image?.imgix_url ? (
            <img
              src={`${streamer.metadata.profile_image.imgix_url}?w=600&h=400&fit=crop&auto=format,compress`}
              alt={streamer.metadata.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {streamer.metadata.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        {/* Live indicator */}
        {streamer.metadata.is_live && (
          <div className="absolute top-3 left-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
          </div>
        )}
        
        {/* Account Status */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(streamer.metadata.account_status.key)}`}></div>
            <span className="text-xs text-white bg-black/70 px-2 py-1 rounded">
              {streamer.metadata.account_status.value}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="absolute bottom-3 right-3">
          <Link
            href={`/streamer/${streamer.slug}`}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {streamer.metadata.is_live ? (
              <>
                <Play className="w-4 h-4" />
                Watch
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                View Profile
              </>
            )}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-foreground text-lg">{streamer.metadata.username}</h3>
            <p className="text-sm text-muted-foreground">{streamer.metadata.email}</p>
          </div>
          
          {showFollowButton && (
            <button
              onClick={handleFollow}
              disabled={isFollowLoading}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isFollowing
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isFollowLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {/* Bio */}
        {showBio && streamer.metadata.bio && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {streamer.metadata.bio}
          </p>
        )}

        {/* Stats */}
        {showStats && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-background rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Followers</span>
              </div>
              <p className="font-semibold text-foreground">
                {formatNumber(streamer.metadata.follower_count)}
              </p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Views</span>
              </div>
              <p className="font-semibold text-foreground">
                {formatNumber(streamer.metadata.total_views)}
              </p>
            </div>
          </div>
        )}

        {/* Social Links */}
        {showSocialLinks && streamer.metadata.social_links && Object.keys(streamer.metadata.social_links).length > 0 && (
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Social Links</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(streamer.metadata.social_links).map(([platform, handle]) => (
                handle && (
                  <a
                    key={platform}
                    href={
                      platform === 'twitter' ? `https://twitter.com/${handle.replace('@', '')}` :
                      platform === 'youtube' ? handle.startsWith('http') ? handle : `https://youtube.com/${handle}` :
                      platform === 'twitch' ? `https://twitch.tv/${handle}` :
                      platform === 'instagram' ? `https://instagram.com/${handle.replace('@', '')}` :
                      handle.startsWith('http') ? handle : `https://${platform}.com/${handle}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded text-xs transition-colors"
                  >
                    <span className="capitalize">{platform}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}