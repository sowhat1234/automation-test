'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { StatsCards, EngagementCards, SystemHealthCard } from '@/components/dashboard/stats-cards'
import { UpcomingPostsCard } from '@/components/dashboard/upcoming-posts'
import { RecentActivityCard } from '@/components/dashboard/recent-activity'
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

        {/* Stats Cards */}
        <StatsCards />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Posts */}
          <UpcomingPostsCard />

          {/* Engagement Stats */}
          <EngagementCards />

          {/* System Health */}
          <SystemHealthCard />

          {/* Recent Activity */}
          <RecentActivityCard />
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
