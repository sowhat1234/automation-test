'use client'

import { 
  Calendar, 
  FileText, 
  Clock, 
  TrendingUp,
  Users,
  MessageSquare,
  Heart,
  Share2,
  Activity,
  Server,
  AlertCircle,
  CheckCircle,
  WifiOff
} from 'lucide-react'
import { useDashboardStats, useSystemHealth } from '@/hooks/use-dashboard-data'

export function StatsCards() {
  const { data: stats, isLoading } = useDashboardStats()
  const { data: health } = useSystemHealth()

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden rounded-lg shadow animate-pulse">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-2 rounded-md bg-gray-200 w-10 h-10"></div>
                <div className="ml-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      name: 'Total Posts',
      value: stats.totalPosts,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeType: 'increase' as 'increase' | 'decrease' | 'neutral'
    },
    {
      name: 'Scheduled Posts',
      value: stats.scheduledPosts,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: `${health?.queueSize || 0} in queue`,
      changeType: 'neutral' as 'increase' | 'decrease' | 'neutral'
    },
    {
      name: 'Posts This Month',
      value: stats.postsThisMonth,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+23%',
      changeType: 'increase' as 'increase' | 'decrease' | 'neutral'
    },
    {
      name: 'Engagement Rate',
      value: `${stats.engagementRate}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+0.8%',
      changeType: 'increase' as 'increase' | 'decrease' | 'neutral'
    }
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <div key={stat.name} className="bg-white overflow-hidden rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className={`ml-2 text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-600' : 
                    stat.changeType === 'decrease' ? 'text-red-600' : 
                    'text-gray-500'
                  }`}>
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function EngagementCards() {
  const { data: stats, isLoading } = useDashboardStats()

  if (isLoading || !stats) {
    return (
      <div className="bg-white shadow rounded-lg animate-pulse">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-5 w-5 bg-gray-200 rounded mr-3"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

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

  return (
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
  )
}

export function SystemHealthCard() {
  const { data: health, isLoading } = useSystemHealth()

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg animate-pulse">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'error':
        return <WifiOff className="h-5 w-5 text-red-600" />
      default:
        return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50'
      case 'error':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">System Health</h3>
          <div className="flex items-center">
            {getStatusIcon(health?.status || 'healthy')}
            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(health?.status || 'healthy')}`}>
              {health?.status || 'Healthy'}
            </span>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">Uptime</span>
            <span className="text-sm font-semibold text-gray-900">{health?.uptime || '99.9%'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">Queue Size</span>
            <span className="text-sm font-semibold text-gray-900">{health?.queueSize || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">Error Rate</span>
            <span className="text-sm font-semibold text-gray-900">{health?.errorRate || 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">Last Post</span>
            <span className="text-sm font-semibold text-gray-900">{health?.lastPostPublished || 'Never'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
