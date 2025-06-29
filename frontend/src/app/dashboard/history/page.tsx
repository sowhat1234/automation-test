'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { usePostHistory } from '@/hooks/use-dashboard-data'
import {
  FileText,
  Image,
  Type,
  Calendar,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  MoreVertical,
  Eye,
  Share2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface PostHistoryItem {
  id: string
  message: string
  post_type: string
  created_at: string
  published_at?: string
  status: 'published' | 'failed' | 'pending'
  facebook_post_id?: string
  engagement?: {
    likes: number
    comments: number
    shares: number
  }
}

export default function PostHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate] = useState('all')

  const { data, isLoading, error } = usePostHistory()
  const posts: PostHistoryItem[] = data?.posts || []

  // Filter posts based on search and filters
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || post.post_type === filterType
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus
    
    let matchesDate = true
    if (filterDate !== 'all') {
      const postDate = new Date(post.created_at)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24))
      
      switch (filterDate) {
        case '7d':
          matchesDate = daysDiff <= 7
          break
        case '30d':
          matchesDate = daysDiff <= 30
          break
        case '90d':
          matchesDate = daysDiff <= 90
          break
      }
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return 'Unknown time'
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
            <h1 className="text-2xl font-bold text-gray-900">Post History</h1>
            <p className="mt-2 text-sm text-gray-600">
              View your published Facebook posts and their performance
            </p>
          </div>
          
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load</h3>
              <p className="mt-1 text-sm text-gray-500">
                Unable to fetch post history. Please try again.
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
          <h1 className="text-2xl font-bold text-gray-900">Post History</h1>
          <p className="mt-2 text-sm text-gray-600">
            View your published Facebook posts and their performance ({posts.length} total)
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            <div className="flex flex-col lg:flex-row gap-4">
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
                  <option value="published">Published</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>

                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
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
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(post.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {post.message}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Published {formatTimestamp(post.published_at || post.created_at)}</span>
                          </div>
                          
                          {post.facebook_post_id && (
                            <div className="flex items-center">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              <span>Facebook Post</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPostTypeColor(post.post_type)}`}>
                              {getPostTypeIcon(post.post_type)}
                              <span className="ml-1">{post.post_type}</span>
                            </span>

                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(post.status)}`}>
                              {post.status}
                            </span>

                            {post.engagement && (
                              <>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  <span className="mr-1">👍</span>
                                  {post.engagement.likes}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  <span className="mr-1">💬</span>
                                  {post.engagement.comments}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  <span className="mr-1">🔄</span>
                                  {post.engagement.shares}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            {post.facebook_post_id && (
                              <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors" title="View on Facebook">
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            <button className="p-1 text-gray-400 hover:text-green-600 transition-colors" title="Share">
                              <Share2 className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="More options">
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
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterDate !== 'all'
                  ? 'No posts match your filters'
                  : 'No post history'
                }
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterDate !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Published posts will appear here once you start creating content.'}
              </p>
              {!searchTerm && filterType === 'all' && filterStatus === 'all' && filterDate === 'all' && (
                <div className="mt-4">
                  <a
                    href="/dashboard/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create Your First Post
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {filteredPosts.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Summary</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{filteredPosts.length}</div>
                  <div className="text-sm text-gray-500">Total Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredPosts.filter(p => p.status === 'published').length}
                  </div>
                  <div className="text-sm text-gray-500">Published</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {filteredPosts.filter(p => p.status === 'failed').length}
                  </div>
                  <div className="text-sm text-gray-500">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {filteredPosts.filter(p => p.status === 'pending').length}
                  </div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
