'use client'

import { Clock, Image, Type, Calendar, ExternalLink } from 'lucide-react'
import { useScheduledPosts } from '@/hooks/use-dashboard-data'
import { formatDistanceToNow } from 'date-fns'

interface ScheduledPost {
  id: string
  message: string
  schedule_time: string
  post_type: string
  image_url?: string
}

export function UpcomingPostsCard() {
  const { data, isLoading, error } = useScheduledPosts(5)

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg animate-pulse">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-5 w-5 bg-gray-200 rounded mt-0.5"></div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Upcoming Posts</h3>
        </div>
        <div className="px-6 py-8 text-center">
          <Clock className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load</h3>
          <p className="mt-1 text-sm text-gray-500">
            Unable to fetch scheduled posts. Please try again.
          </p>
        </div>
      </div>
    )
  }

  const upcomingPosts = data?.posts || []

  const getPostTypeIcon = (postType: string) => {
    switch (postType) {
      case 'image':
        return <Image className="h-4 w-4" />
      case 'text':
        return <Type className="h-4 w-4" />
      default:
        return <Type className="h-4 w-4" />
    }
  }

  const getPostTypeColor = (postType: string) => {
    switch (postType) {
      case 'image':
        return 'bg-purple-100 text-purple-800'
      case 'text':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTimeUntilPost = (scheduleTime: string) => {
    try {
      const scheduledDate = new Date(scheduleTime)
      const now = new Date()
      
      if (scheduledDate < now) {
        return 'Overdue'
      }
      
      return `in ${formatDistanceToNow(scheduledDate)}`
    } catch (error) {
      return 'Invalid date'
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Upcoming Posts</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {upcomingPosts.length} scheduled
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {upcomingPosts.length > 0 ? (
          upcomingPosts.slice(0, 5).map((post: ScheduledPost) => (
            <div key={post.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {post.message}
                  </p>
                  <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(post.schedule_time).toLocaleDateString()} at{' '}
                      {new Date(post.schedule_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-blue-600 font-medium">
                      {getTimeUntilPost(post.schedule_time)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPostTypeColor(post.post_type)}`}>
                      {getPostTypeIcon(post.post_type)}
                      <span className="ml-1">{post.post_type}</span>
                    </span>
                    {post.image_url && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Image className="h-3 w-3 mr-1" />
                        <span>Has image</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No scheduled posts</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by scheduling your first post.
            </p>
            <div className="mt-4">
              <a
                href="/dashboard/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Post
              </a>
            </div>
          </div>
        )}
      </div>
      {upcomingPosts.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <a 
            href="/dashboard/scheduled" 
            className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center"
          >
            View all scheduled posts
            <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  )
}
