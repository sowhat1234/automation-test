'use client'

import { useState, useMemo } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { useScheduledPosts } from '@/hooks/use-dashboard-data'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Image, 
  Type, 
  Plus,
  Filter
} from 'lucide-react'
import { format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO,
  isToday
} from 'date-fns'

interface ScheduledPost {
  id: string
  message: string
  schedule_time: string
  post_type: string
  image_url?: string
  status?: 'scheduled' | 'paused' | 'draft'
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewType, setViewType] = useState<'month' | 'week'>('month')
  const [filterType, setFilterType] = useState('all')
  
  const { data, isLoading, error } = useScheduledPosts()
  const posts: ScheduledPost[] = data?.posts || []

  // Get posts for a specific date
  const getPostsForDate = (date: Date) => {
    return posts.filter(post => {
      try {
        const postDate = parseISO(post.schedule_time)
        return isSameDay(postDate, date)
      } catch {
        return false
      }
    }).filter(post => {
      if (filterType === 'all') return true
      return post.post_type === filterType
    })
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentDate])

  const selectedDatePosts = selectedDate ? getPostsForDate(selectedDate) : []

  const getPostTypeIcon = (postType: string) => {
    switch (postType) {
      case 'image':
        return <Image className="h-3 w-3" />
      case 'text':
        return <Type className="h-3 w-3" />
      default:
        return <Type className="h-3 w-3" />
    }
  }

  const getPostTypeColor = (postType: string) => {
    switch (postType) {
      case 'image':
        return 'bg-purple-500'
      case 'text':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
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
            <div className="p-6">
              <div className="grid grid-cols-7 gap-4">
                {[...Array(35)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="mt-2 text-sm text-gray-600">
              View and manage your scheduled posts in calendar format
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="text">Text Posts</option>
              <option value="image">Image Posts</option>
            </select>
            <a
              href="/dashboard/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow rounded-lg">
              {/* Calendar Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-medium text-gray-900">
                      {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {posts.length} scheduled posts
                  </div>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-6">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const dayPosts = getPostsForDate(day)
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    const isCurrentMonth = isSameMonth(day, currentDate)
                    const isCurrentDay = isToday(day)
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          relative p-2 h-24 text-left border border-gray-200 hover:bg-gray-50 transition-colors
                          ${isSelected ? 'bg-blue-50 border-blue-500' : ''}
                          ${!isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''}
                          ${isCurrentDay ? 'bg-yellow-50 border-yellow-300' : ''}
                        `}
                      >
                        <div className="text-sm font-medium">
                          {format(day, 'd')}
                        </div>
                        
                        {/* Post indicators */}
                        <div className="mt-1 space-y-1">
                          {dayPosts.slice(0, 3).map((post, index) => (
                            <div
                              key={post.id}
                              className={`flex items-center space-x-1 p-1 rounded text-xs text-white ${getPostTypeColor(post.post_type)}`}
                              title={post.message}
                            >
                              {getPostTypeIcon(post.post_type)}
                              <span className="truncate flex-1">
                                {format(parseISO(post.schedule_time), 'HH:mm')}
                              </span>
                            </div>
                          ))}
                          {dayPosts.length > 3 && (
                            <div className="text-xs text-gray-500 pl-1">
                              +{dayPosts.length - 3} more
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Date Details */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select a date'}
                </h3>
                {selectedDate && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedDatePosts.length} post{selectedDatePosts.length !== 1 ? 's' : ''} scheduled
                  </p>
                )}
              </div>
              
              <div className="p-6">
                {selectedDate ? (
                  selectedDatePosts.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDatePosts.map((post) => (
                        <div key={post.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              post.post_type === 'image' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {getPostTypeIcon(post.post_type)}
                              <span className="ml-1">{post.post_type}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {format(parseISO(post.schedule_time), 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 line-clamp-3">
                            {post.message}
                          </p>
                          {post.image_url && (
                            <div className="mt-2 text-xs text-gray-500 flex items-center">
                              <Image className="h-3 w-3 mr-1" />
                              Has image
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No posts scheduled</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No posts are scheduled for this date.
                      </p>
                      <div className="mt-4">
                        <a
                          href="/dashboard/create"
                          className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Schedule Post
                        </a>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Select a date</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Click on a date to view scheduled posts.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">This Month</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total Posts</span>
                    <span className="text-sm font-medium text-gray-900">{posts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Text Posts</span>
                    <span className="text-sm font-medium text-gray-900">
                      {posts.filter(p => p.post_type === 'text').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Image Posts</span>
                    <span className="text-sm font-medium text-gray-900">
                      {posts.filter(p => p.post_type === 'image').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
