'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { 
  Calendar, 
  FileText, 
  Clock, 
  TrendingUp,
  Users,
  MessageSquare,
  Heart,
  Share2
} from 'lucide-react'

interface DashboardStats {
  totalPosts: number
  scheduledPosts: number
  postsThisMonth: number
  engagementRate: number
  totalReach: number
  totalLikes: number
  totalComments: number
  totalShares: number
}

interface ScheduledPost {
  id: string
  message: string
  schedule_time: string
  post_type: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    scheduledPosts: 0,
    postsThisMonth: 0,
    engagementRate: 0,
    totalReach: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0
  })
  const [upcomingPosts, setUpcomingPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch scheduled posts
        const scheduledResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/scheduled?limit=5`)
        if (scheduledResponse.ok) {
          const scheduledData = await scheduledResponse.json()
          setUpcomingPosts(scheduledData.posts || [])
          setStats(prev => ({
            ...prev,
            scheduledPosts: scheduledData.count || 0
          }))
        }

        // Fetch post history for stats
        const historyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/history`)
        if (historyResponse.ok) {
          const historyData = await historyResponse.json()
          const posts = historyData.posts || []
          const currentMonth = new Date().getMonth()
          const postsThisMonth = posts.filter((post: any) => {
            const postDate = new Date(post.created_at)
            return postDate.getMonth() === currentMonth
          }).length

          setStats(prev => ({
            ...prev,
            totalPosts: posts.length,
            postsThisMonth
          }))
        }

        // Mock engagement data (would come from Facebook API in real implementation)
        setStats(prev => ({
          ...prev,
          engagementRate: 4.2,
          totalReach: 12500,
          totalLikes: 1250,
          totalComments: 320,
          totalShares: 180
        }))

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const statCards = [
    {
      name: 'Total Posts',
      value: stats.totalPosts,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Scheduled Posts',
      value: stats.scheduledPosts,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      name: 'Posts This Month',
      value: stats.postsThisMonth,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      name: 'Engagement Rate',
      value: `${stats.engagementRate}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  const engagementStats = [
    {
      name: 'Total Reach',
      value: stats.totalReach.toLocaleString(),
      icon: Users,
      color: 'text-blue-600'
    },
    {
      name: 'Likes',
      value: stats.totalLikes.toLocaleString(),
      icon: Heart,
      color: 'text-red-600'
    },
    {
      name: 'Comments',
      value: stats.totalComments.toLocaleString(),
      icon: MessageSquare,
      color: 'text-green-600'
    },
    {
      name: 'Shares',
      value: stats.totalShares.toLocaleString(),
      icon: Share2,
      color: 'text-purple-600'
    }
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor your Facebook automation performance and upcoming posts
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.name} className="bg-white overflow-hidden rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-2 rounded-md ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Posts */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Upcoming Posts</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {upcomingPosts.length > 0 ? (
                upcomingPosts.slice(0, 5).map((post) => (
                  <div key={post.id} className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {post.message}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(post.schedule_time).toLocaleDateString()} at{' '}
                          {new Date(post.schedule_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          {post.post_type}
                        </span>
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
                </div>
              )}
            </div>
            {upcomingPosts.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <a href="/dashboard/scheduled" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  View all scheduled posts →
                </a>
              </div>
            )}
          </div>

          {/* Engagement Stats */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Engagement Overview</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {engagementStats.map((stat) => (
                  <div key={stat.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <stat.icon className={`h-5 w-5 ${stat.color} mr-3`} />
                      <span className="text-sm font-medium text-gray-900">{stat.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{stat.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <a href="/dashboard/analytics" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  View detailed analytics →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a
                href="/dashboard/create"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create New Post
              </a>
              <a
                href="/dashboard/scheduled"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Scheduled Posts
              </a>
              <a
                href="/dashboard/calendar"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Open Calendar
              </a>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
