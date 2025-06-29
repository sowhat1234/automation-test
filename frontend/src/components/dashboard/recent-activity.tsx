'use client'

import { Activity, CheckCircle, Clock, AlertTriangle, ExternalLink } from 'lucide-react'
import { useRecentActivity } from '@/hooks/use-dashboard-data'
import { formatDistanceToNow } from 'date-fns'

interface ActivityItem {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  status?: string
}

export function RecentActivityCard() {
  const { data: activities, isLoading, error } = useRecentActivity()

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg animate-pulse">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full mt-0.5"></div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="px-6 py-8 text-center">
          <Activity className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load</h3>
          <p className="mt-1 text-sm text-gray-500">
            Unable to fetch recent activity. Please try again.
          </p>
        </div>
      </div>
    )
  }

  const getActivityIcon = (type: string, status?: string) => {
    switch (type) {
      case 'post_published':
        return status === 'success' 
          ? <CheckCircle className="h-6 w-6 text-green-600" />
          : <AlertTriangle className="h-6 w-6 text-yellow-600" />
      case 'post_scheduled':
        return <Clock className="h-6 w-6 text-blue-600" />
      default:
        return <Activity className="h-6 w-6 text-gray-600" />
    }
  }

  const getActivityBgColor = (type: string, status?: string) => {
    switch (type) {
      case 'post_published':
        return status === 'success' ? 'bg-green-100' : 'bg-yellow-100'
      case 'post_scheduled':
        return 'bg-blue-100'
      default:
        return 'bg-gray-100'
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

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {activities?.length || 0} events
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {activities && activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 p-1 rounded-full ${getActivityBgColor(activity.type, activity.status)}`}>
                  {getActivityIcon(activity.type, activity.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {activity.description}
                  </p>
                  <div className="mt-2 flex items-center text-xs text-gray-400">
                    <span>{formatTimestamp(activity.timestamp)}</span>
                    {activity.status && (
                      <>
                        <span className="mx-2">•</span>
                        <span className={`font-medium ${
                          activity.status === 'success' ? 'text-green-600' :
                          activity.status === 'pending' ? 'text-yellow-600' :
                          activity.status === 'failed' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {activity.status}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
            <p className="mt-1 text-sm text-gray-500">
              Activity will appear here as you create and publish posts.
            </p>
          </div>
        )}
      </div>
      {activities && activities.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <a 
            href="/dashboard/history" 
            className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center"
          >
            View all activity
            <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  )
}
