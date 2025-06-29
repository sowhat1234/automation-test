'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Bell,
  Shield,
  Palette,
  Globe,
  Key,
  Database,
  Moon,
  Sun,
  Monitor,
  Check,
  AlertTriangle
} from 'lucide-react'

interface SettingsForm {
  // API Configuration
  apiUrl: string
  facebookAppId: string
  facebookAppSecret: string
  webhookUrl: string
  
  // Notifications
  emailNotifications: boolean
  browserNotifications: boolean
  slackNotifications: boolean
  slackWebhook: string
  
  // Theme & Appearance
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  dateFormat: string
  
  // Security
  twoFactorAuth: boolean
  sessionTimeout: number
  apiRateLimit: number
  
  // Automation
  autoRefreshInterval: number
  maxRetryAttempts: number
  defaultPostVisibility: 'public' | 'friends' | 'only_me'
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [testingConnection, setTestingConnection] = useState(false)
  
  const [settings, setSettings] = useState<SettingsForm>({
    // API Configuration
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    facebookAppId: '',
    facebookAppSecret: '',
    webhookUrl: '',
    
    // Notifications
    emailNotifications: true,
    browserNotifications: true,
    slackNotifications: false,
    slackWebhook: '',
    
    // Theme & Appearance
    theme: 'system',
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/dd/yyyy',
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: 60,
    apiRateLimit: 100,
    
    // Automation
    autoRefreshInterval: 30,
    maxRetryAttempts: 3,
    defaultPostVisibility: 'public'
  })

  const tabs = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'api', name: 'API Configuration', icon: Database },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'automation', name: 'Automation', icon: RefreshCw }
  ]

  const handleInputChange = (field: keyof SettingsForm, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('saving')
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In real implementation, save to backend
      console.log('Saving settings:', settings)
      
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const testApiConnection = async () => {
    setTestingConnection(true)
    try {
      const response = await fetch(`${settings.apiUrl}/health`)
      if (response.ok) {
        alert('API connection successful!')
      } else {
        alert('API connection failed')
      }
    } catch (error) {
      alert('API connection failed: ' + error)
    } finally {
      setTestingConnection(false)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Language</label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date Format</label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                    <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                    <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'api':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">API Base URL</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="url"
                      value={settings.apiUrl}
                      onChange={(e) => handleInputChange('apiUrl', e.target.value)}
                      className="flex-1 block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="http://localhost:8000"
                    />
                    <button
                      onClick={testApiConnection}
                      disabled={testingConnection}
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 disabled:opacity-50"
                    >
                      {testingConnection ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        'Test'
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Facebook App ID</label>
                  <input
                    type="text"
                    value={settings.facebookAppId}
                    onChange={(e) => handleInputChange('facebookAppId', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Your Facebook App ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Facebook App Secret</label>
                  <input
                    type="password"
                    value={settings.facebookAppSecret}
                    onChange={(e) => handleInputChange('facebookAppSecret', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Your Facebook App Secret"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Webhook URL</label>
                  <input
                    type="url"
                    value={settings.webhookUrl}
                    onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="https://your-domain.com/webhook"
                  />
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Email Notifications</div>
                    <div className="text-sm text-gray-500">Receive email alerts for important events</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Browser Notifications</div>
                    <div className="text-sm text-gray-500">Show browser notifications for real-time updates</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.browserNotifications}
                    onChange={(e) => handleInputChange('browserNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Slack Notifications</div>
                    <div className="text-sm text-gray-500">Send notifications to Slack channel</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.slackNotifications}
                    onChange={(e) => handleInputChange('slackNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                {settings.slackNotifications && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Slack Webhook URL</label>
                    <input
                      type="url"
                      value={settings.slackWebhook}
                      onChange={(e) => handleInputChange('slackWebhook', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://hooks.slack.com/services/..."
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )
        
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Theme & Appearance</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Monitor }
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => handleInputChange('theme', value)}
                        className={`flex items-center justify-center p-3 border-2 rounded-lg transition-colors ${
                          settings.theme === value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`h-5 w-5 mr-2 ${settings.theme === value ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${settings.theme === value ? 'text-blue-900' : 'text-gray-700'}`}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Two-Factor Authentication</div>
                    <div className="text-sm text-gray-500">Add an extra layer of security to your account</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.twoFactorAuth}
                    onChange={(e) => handleInputChange('twoFactorAuth', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">API Rate Limit (requests per minute)</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={settings.apiRateLimit}
                    onChange={(e) => handleInputChange('apiRateLimit', parseInt(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'automation':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Automation Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Auto Refresh Interval (seconds)</label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={settings.autoRefreshInterval}
                    onChange={(e) => handleInputChange('autoRefreshInterval', parseInt(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <p className="mt-1 text-sm text-gray-500">How often to refresh dashboard data</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Retry Attempts</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxRetryAttempts}
                    onChange={(e) => handleInputChange('maxRetryAttempts', parseInt(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <p className="mt-1 text-sm text-gray-500">Number of times to retry failed operations</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default Post Visibility</label>
                  <select
                    value={settings.defaultPostVisibility}
                    onChange={(e) => handleInputChange('defaultPostVisibility', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="only_me">Only Me</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="mt-2 text-sm text-gray-600">
                Configure your Facebook automation platform preferences
              </p>
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saveStatus === 'saving' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : saveStatus === 'success' ? (
                <Check className="h-4 w-4 mr-2" />
              ) : saveStatus === 'error' ? (
                <AlertTriangle className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save Changes'}
            </button>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="flex">
              {/* Sidebar */}
              <div className="w-64 border-r border-gray-200">
                <nav className="p-6 space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 border-blue-500'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className={`h-5 w-5 mr-3 ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'}`} />
                        {tab.name}
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Content */}
              <div className="flex-1 p-6">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
