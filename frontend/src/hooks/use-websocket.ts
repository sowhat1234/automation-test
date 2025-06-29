import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

interface WebSocketNotification {
  id: string
  type: 'post_published' | 'post_failed' | 'post_scheduled' | 'system_health'
  title: string
  message: string
  timestamp: string
  data?: any
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<WebSocketNotification[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const queryClient = useQueryClient()
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    try {
      setConnectionStatus('connecting')
      
      // Use WebSocket URL (in production, this would be wss://)
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws'
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectAttempts.current = 0
        
        // Send authentication or initialization message
        wsRef.current?.send(JSON.stringify({
          type: 'subscribe',
          data: { userId: 'current-user' } // In real app, use actual user ID
        }))
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleWebSocketMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        setConnectionStatus('disconnected')
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000 // Exponential backoff
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
      }

    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      setConnectionStatus('error')
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect')
      wsRef.current = null
    }
    
    setIsConnected(false)
    setConnectionStatus('disconnected')
  }, [])

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'post_status_update':
        // Invalidate post-related queries to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] })
        queryClient.invalidateQueries({ queryKey: ['post-history'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        
        // Add notification
        const notification: WebSocketNotification = {
          id: Date.now().toString(),
          type: message.data.status === 'published' ? 'post_published' : 'post_failed',
          title: message.data.status === 'published' ? 'Post Published' : 'Post Failed',
          message: `Post "${message.data.message.substring(0, 50)}..." ${message.data.status}`,
          timestamp: message.timestamp,
          data: message.data
        }
        
        setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Keep last 10
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico'
          })
        }
        break

      case 'system_health_update':
        // Invalidate system health queries
        queryClient.invalidateQueries({ queryKey: ['system-health'] })
        break

      case 'queue_update':
        // Invalidate queue-related queries
        queryClient.invalidateQueries({ queryKey: ['system-health'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        break

      case 'new_scheduled_post':
        // Invalidate scheduled posts queries
        queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        
        const scheduleNotification: WebSocketNotification = {
          id: Date.now().toString(),
          type: 'post_scheduled',
          title: 'Post Scheduled',
          message: `New post scheduled for ${new Date(message.data.schedule_time).toLocaleString()}`,
          timestamp: message.timestamp,
          data: message.data
        }
        
        setNotifications(prev => [scheduleNotification, ...prev.slice(0, 9)])
        break

      default:
        console.log('Unknown WebSocket message type:', message.type)
    }
  }, [queryClient])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    connect()
    
    // Request notification permission
    requestNotificationPermission()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect, requestNotificationPermission])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  return {
    isConnected,
    connectionStatus,
    notifications,
    connect,
    disconnect,
    clearNotifications,
    removeNotification,
    requestNotificationPermission
  }
}

// Hook for components that only need connection status
export function useWebSocketStatus() {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  
  // This would typically share state with the main WebSocket hook
  // For now, we'll simulate the connection status
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate connection status (in real implementation, this would be shared state)
      setConnectionStatus('connected')
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  return { connectionStatus }
}
