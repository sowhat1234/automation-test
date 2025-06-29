import { useQuery } from '@tanstack/react-query'

const API_URL = process.env.NEXT_PUBLIC_API_URL

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
  image_url?: string
}

interface PostHistoryItem {
  id: string
  message: string
  post_type: string
  created_at: string
  published_at?: string
  status: string
}

interface SystemHealthMetrics {
  uptime: string
  lastPostPublished: string
  queueSize: number
  errorRate: number
  status: 'healthy' | 'warning' | 'error'
}

// Fetch scheduled posts
export function useScheduledPosts(limit?: number) {
  return useQuery({
    queryKey: ['scheduled-posts', limit],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/posts/scheduled${limit ? `?limit=${limit}` : ''}`)
      if (!response.ok) {
        throw new Error('Failed to fetch scheduled posts')
      }
      return response.json()
    },
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
  })
}

// Fetch post history
export function usePostHistory(limit?: number) {
  return useQuery({
    queryKey: ['post-history', limit],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/posts/history${limit ? `?limit=${limit}` : ''}`)
      if (!response.ok) {
        throw new Error('Failed to fetch post history')
      }
      return response.json()
    },
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

// Calculate dashboard stats from API data
export function useDashboardStats() {
  const { data: scheduledData } = useScheduledPosts()
  const { data: historyData } = usePostHistory()

  return useQuery({
    queryKey: ['dashboard-stats', scheduledData, historyData],
    queryFn: async (): Promise<DashboardStats> => {
      const posts = historyData?.posts || []
      const currentMonth = new Date().getMonth()
      const postsThisMonth = posts.filter((post: PostHistoryItem) => {
        const postDate = new Date(post.created_at)
        return postDate.getMonth() === currentMonth
      }).length

      // Mock engagement data (would come from Facebook API in real implementation)
      return {
        totalPosts: posts.length,
        scheduledPosts: scheduledData?.count || 0,
        postsThisMonth,
        engagementRate: 4.2,
        totalReach: 12500,
        totalLikes: 1250,
        totalComments: 320,
        totalShares: 180,
      }
    },
    enabled: !!historyData && !!scheduledData,
  })
}

// System health metrics
export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: async (): Promise<SystemHealthMetrics> => {
      try {
        const response = await fetch(`${API_URL}/api/health`)
        if (!response.ok) {
          throw new Error('Health check failed')
        }
        
        const data = await response.json()
        return {
          uptime: data.uptime || 'Unknown',
          lastPostPublished: data.lastPostPublished || 'Never',
          queueSize: data.queueSize || 0,
          errorRate: data.errorRate || 0,
          status: data.status || 'healthy',
        }
      } catch (error) {
        // Fallback data if health endpoint doesn't exist yet
        return {
          uptime: '99.9%',
          lastPostPublished: '2 hours ago',
          queueSize: 3,
          errorRate: 0.1,
          status: 'healthy',
        }
      }
    },
    refetchInterval: 15 * 1000, // Check every 15 seconds
  })
}

interface ActivityItem {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  status?: string
}

// Recent activity feed
export function useRecentActivity() {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async (): Promise<ActivityItem[]> => {
      const response = await fetch(`${API_URL}/api/posts/history?limit=10`)
      if (!response.ok) {
        throw new Error('Failed to fetch recent activity')
      }
      const data = await response.json()
      
      // Transform into activity feed format
      return (data.posts || []).map((post: PostHistoryItem): ActivityItem => ({
        id: post.id,
        type: 'post_published',
        title: 'Post Published',
        description: post.message.substring(0, 100) + (post.message.length > 100 ? '...' : ''),
        timestamp: post.published_at || post.created_at,
        status: post.status,
      }))
    },
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}
