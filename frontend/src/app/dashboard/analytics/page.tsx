'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { useDashboardStats, usePostHistory } from '@/hooks/use-dashboard-data'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import {
  TrendingUp,
  Users,
  Heart,
  MessageSquare,
  Share2,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: historyData, isLoading: historyLoading } = usePostHistory()

  // Mock analytics data (in real app, this would come from Facebook API)
  const engagementOverTime = [
    { date: '2025-06-23', posts: 2, likes: 45, comments: 8, shares: 3 },
    { date: '2025-06-24', posts: 1, likes: 32, comments: 5, shares: 2 },
    { date: '2025-06-25', posts: 3, likes: 67, comments: 12, shares: 7 },
    { date: '2025-06-26', posts: 1, likes: 28, comments: 4, shares: 1 },
    { date: '2025-06-27', posts: 2, likes: 54, comments: 9, shares: 4 },
    { date: '2025-06-28', posts: 1, likes: 41, comments: 6, shares: 3 },
    { date: '2025-06-29', posts: 2, likes: 59, comments: 11, shares: 5 }
  ]

  const postTypeDistribution = [
    { name: 'Text Posts', value: 65, color: '#3B82F6' },
    { name: 'Image Posts', value: 35, color: '#8B5CF6' }
  ]

  const bestPerformingTimes = [
    { hour: '6:00', engagement: 45 },
    { hour: '9:00', engagement: 78 },
    { hour: '12:00', engagement: 92 },
    { hour: '15:00', engagement: 65 },
    { hour: '18:00', engagement: 88 },
    { hour: '21:00', engagement: 71 }
  ]

  const weeklyPerformance = [
    { day: 'Mon', posts: 8, engagement: 245 },
    { day: 'Tue', posts: 12, engagement: 389 },
    { day: 'Wed', posts: 15, engagement: 452 },
    { day: 'Thu', posts: 11, engagement: 334 },
    { day: 'Fri', posts: 18, engagement: 567 },
    { day: 'Sat', posts: 14, engagement: 423 },
    { day: 'Sun', posts: 9, engagement: 298 }
  ]

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 2000)
  }

  const handleExport = () => {
    // Mock export functionality
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Date,Posts,Likes,Comments,Shares\n" +
      engagementOverTime.map(row => `${row.date},${row.posts},${row.likes},${row.comments},${row.shares}`).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "analytics_export.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (statsLoading || historyLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white shadow rounded-lg animate-pulse">
                <div className="p-6 h-32"></div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track your Facebook post performance and engagement metrics
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-2 rounded-md bg-blue-50">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Reach</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900">{stats?.totalReach?.toLocaleString() || '12.5K'}</p>
                    <p className="ml-2 text-sm font-medium text-green-600">+12%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-2 rounded-md bg-red-50">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Likes</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900">{stats?.totalLikes?.toLocaleString() || '1.25K'}</p>
                    <p className="ml-2 text-sm font-medium text-green-600">+8%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-2 rounded-md bg-green-50">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Comments</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900">{stats?.totalComments?.toLocaleString() || '320'}</p>
                    <p className="ml-2 text-sm font-medium text-green-600">+15%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-2 rounded-md bg-purple-50">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Engagement Rate</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900">{stats?.engagementRate || 4.2}%</p>
                    <p className="ml-2 text-sm font-medium text-green-600">+0.8%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Over Time */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Engagement Over Time</h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={engagementOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <Area type="monotone" dataKey="likes" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="comments" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="shares" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Post Type Distribution */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Post Type Distribution</h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={postTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {postTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Best Performing Times */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Best Performing Times</h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bestPerformingTimes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="engagement" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Performance */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Weekly Performance</h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="engagement" stroke="#8B5CF6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Insights & Recommendations */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Insights & Recommendations</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Peak Engagement</p>
                  <p className="text-sm text-gray-500">Your posts perform best around 12:00 PM and 6:00 PM. Consider scheduling more content during these times.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Audience Growth</p>
                  <p className="text-sm text-gray-500">Your reach has increased by 12% this month. Image posts are generating 23% more engagement than text posts.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Posting Frequency</p>
                  <p className="text-sm text-gray-500">Fridays show the highest engagement. Consider increasing your posting frequency on weekends.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
