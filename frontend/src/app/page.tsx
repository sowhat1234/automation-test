'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [apiStatus, setApiStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Test API connection
    const testApi = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/status`)
        const data = await response.json()
        setApiStatus(data)
      } catch (error) {
        console.error('Failed to connect to API:', error)
        setApiStatus({ error: 'Failed to connect to backend API' })
      } finally {
        setLoading(false)
      }
    }

    testApi()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Facebook Automation Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Automate your Facebook posting and scheduling with ease
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-4">📝</div>
            <h3 className="text-lg font-semibold mb-2">Create Posts</h3>
            <p className="text-gray-600">Create engaging posts with text and images</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-4">⏰</div>
            <h3 className="text-lg font-semibold mb-2">Schedule</h3>
            <p className="text-gray-600">Schedule posts for optimal engagement times</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">Analytics</h3>
            <p className="text-gray-600">Track performance and engagement metrics</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Checking API connection...</span>
            </div>
          ) : (
            <div className="text-left">
              <div className="flex items-center justify-between mb-2">
                <span>Frontend:</span>
                <span className="text-green-600 font-semibold">✓ Running</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span>Backend API:</span>
                <span className={apiStatus?.error ? 'text-red-600' : 'text-green-600'}>
                  {apiStatus?.error ? '✗ Disconnected' : '✓ Connected'}
                </span>
              </div>
              {apiStatus && !apiStatus.error && (
                <div className="flex items-center justify-between">
                  <span>Facebook Config:</span>
                  <span className={apiStatus.facebook_configured ? 'text-green-600' : 'text-yellow-600'}>
                    {apiStatus.facebook_configured ? '✓ Configured' : '⚠ Not Configured'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-x-4">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Get Started
          </button>
          <button className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}
