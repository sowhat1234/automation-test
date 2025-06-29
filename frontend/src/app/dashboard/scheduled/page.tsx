'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { useScheduledPosts } from '@/hooks/use-dashboard-data'
import { 
  Clock, 
  Image, 
  Type, 
  Calendar, 
  MoreVertical,
  Edit3,
  Trash2,
  Play,
  Pause,
  Search,
  Filter
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ScheduledPost {
  id: string
  message: string
  schedule_time: string
  post_type: string
  image_url?: string
  status: 'scheduled' | 'paused' | 'draft'
}

export default function ScheduledPostsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  
  const { data, isLoading, error } = useScheduledPosts()

  const posts: ScheduledPost[] = data?.posts || []

  // Filter posts based on search and filters
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || post.post_type === filterType
    const matchesStatus = filterStatus === 'all' || (post.status || 'scheduled') === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-green-100 text-green-800'
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>
          <div className="bg-white shadow rounded-lg animate-pulse">
            <div className="px-6 py-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scheduled Posts</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your scheduled Facebook posts
            </p>
          </div>
          
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-8 text-center">
              <Clock className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load</h3>
              <p className="mt-1 text-sm text-gray-500">
                Unable to fetch scheduled posts. Please try again.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheduled Posts</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your scheduled Facebook posts ({posts.length} total)
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filters */}
              <div className="flex gap-4">
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="text">Text Posts</option>
                  <option value="image">Image Posts</option>
                </select>

                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="paused">Paused</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="bg-white shadow rounded-lg">
          {filteredPosts.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredPosts.map((post) => (
                <div key={post.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <Clock className="h-6 w-6 text-gray-400 mt-1" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            {post.message}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>
                              {new Date(post.schedule_time).toLocaleDateString()} at{' '}
                              {new Date(post.schedule_time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          
                          <span className="text-blue-600 font-medium">
                            {getTimeUntilPost(post.schedule_time)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPostTypeColor(post.post_type)}`}>
                              {getPostTypeIcon(post.post_type)}
                              <span className="ml-1">{post.post_type}</span>
                            </span>

                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(post.status || 'scheduled')}`}>
                              {post.status || 'scheduled'}
                            </span>

                            {post.image_url && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                <Image className="h-3 w-3 mr-1" />
                                Has image
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-yellow-600 transition-colors">
                              <Pause className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                  ? 'No posts match your filters' 
                  : 'No scheduled posts'
                }
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by scheduling your first post.'
                }
              </p>
              {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
                <div className="mt-4">
                  <a
                    href="/dashboard/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create Post
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
