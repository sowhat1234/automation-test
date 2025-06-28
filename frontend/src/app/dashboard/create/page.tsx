'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard-layout'
import { useForm } from 'react-hook-form'
import { 
  FileText, 
  Image as ImageIcon, 
  Clock, 
  Send,
  Calendar,
  Upload
} from 'lucide-react'

interface TextPostForm {
  message: string
  link?: string
  scheduleTime?: string
  recurrence?: string
}

interface ImagePostForm {
  message: string
  altText?: string
  scheduleTime?: string
  recurrence?: string
  image: FileList
}

export default function CreatePostPage() {
  const router = useRouter()
  const [postType, setPostType] = useState<'text' | 'image'>('text')
  const [isScheduled, setIsScheduled] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const textForm = useForm<TextPostForm>()
  const imageForm = useForm<ImagePostForm>()

  const onSubmitTextPost = async (data: TextPostForm) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const endpoint = isScheduled ? '/api/posts/schedule' : '/api/posts/text'
      const payload = isScheduled 
        ? {
            message: data.message,
            link: data.link || null,
            schedule_time: new Date(data.scheduleTime!).toISOString(),
            recurrence: data.recurrence || 'none'
          }
        : {
            message: data.message,
            link: data.link || null
          }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create post')
      }

      const result = await response.json()
      setSuccess(isScheduled ? 'Post scheduled successfully!' : 'Post published successfully!')
      textForm.reset()

      // Redirect after success
      setTimeout(() => {
        router.push(isScheduled ? '/dashboard/scheduled' : '/dashboard/history')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmitImagePost = async (data: ImagePostForm) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('message', data.message)
      if (data.altText) formData.append('alt_text', data.altText)
      formData.append('image', data.image[0])
      
      if (isScheduled) {
        formData.append('schedule_time', new Date(data.scheduleTime!).toISOString())
        formData.append('recurrence', data.recurrence || 'none')
      }

      const endpoint = isScheduled ? '/api/posts/schedule-image' : '/api/posts/image'
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create image post')
      }

      const result = await response.json()
      setSuccess(isScheduled ? 'Image post scheduled successfully!' : 'Image post published successfully!')
      imageForm.reset()

      // Redirect after success
      setTimeout(() => {
        router.push(isScheduled ? '/dashboard/scheduled' : '/dashboard/history')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 5) // Minimum 5 minutes from now
    return now.toISOString().slice(0, 16)
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Post</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create and publish or schedule your Facebook posts
            </p>
          </div>

          {/* Post Type Selection */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Post Type</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setPostType('text')}
                  className={`flex items-center p-4 border-2 rounded-lg transition-colors ${
                    postType === 'text'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className={`h-6 w-6 mr-3 ${postType === 'text' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Text Post</div>
                    <div className="text-sm text-gray-500">Share text content with optional link</div>
                  </div>
                </button>
                <button
                  onClick={() => setPostType('image')}
                  className={`flex items-center p-4 border-2 rounded-lg transition-colors ${
                    postType === 'image'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ImageIcon className={`h-6 w-6 mr-3 ${postType === 'image' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Image Post</div>
                    <div className="text-sm text-gray-500">Share an image with caption</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Scheduling Option */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Publishing Options</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!isScheduled}
                    onChange={() => setIsScheduled(false)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <Send className="h-5 w-5 ml-2 mr-2 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">Publish Now</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={isScheduled}
                    onChange={() => setIsScheduled(true)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <Clock className="h-5 w-5 ml-2 mr-2 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">Schedule for Later</span>
                </label>
              </div>
            </div>
          </div>

          {/* Post Form */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {postType === 'text' ? 'Text Post' : 'Image Post'} Content
              </h3>
            </div>
            <div className="p-6">
              {/* Success/Error Messages */}
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {postType === 'text' ? (
                <form onSubmit={textForm.handleSubmit(onSubmitTextPost)} className="space-y-6">
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      Message *
                    </label>
                    <textarea
                      {...textForm.register('message', { required: 'Message is required' })}
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="What's on your mind?"
                    />
                    {textForm.formState.errors.message && (
                      <p className="mt-2 text-sm text-red-600">{textForm.formState.errors.message.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="link" className="block text-sm font-medium text-gray-700">
                      Link (Optional)
                    </label>
                    <input
                      {...textForm.register('link')}
                      type="url"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://example.com"
                    />
                  </div>

                  {isScheduled && (
                    <>
                      <div>
                        <label htmlFor="scheduleTime" className="block text-sm font-medium text-gray-700">
                          Schedule Time *
                        </label>
                        <input
                          {...textForm.register('scheduleTime', { required: isScheduled ? 'Schedule time is required' : false })}
                          type="datetime-local"
                          min={getMinDateTime()}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        {textForm.formState.errors.scheduleTime && (
                          <p className="mt-2 text-sm text-red-600">{textForm.formState.errors.scheduleTime.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="recurrence" className="block text-sm font-medium text-gray-700">
                          Recurrence
                        </label>
                        <select
                          {...textForm.register('recurrence')}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="none">No recurrence</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {isScheduled ? 'Scheduling...' : 'Publishing...'}
                        </>
                      ) : (
                        <>
                          {isScheduled ? <Calendar className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                          {isScheduled ? 'Schedule Post' : 'Publish Now'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={imageForm.handleSubmit(onSubmitImagePost)} className="space-y-6">
                  <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                      Image *
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="image-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>Upload a file</span>
                            <input
                              {...imageForm.register('image', { required: 'Image is required' })}
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                    {imageForm.formState.errors.image && (
                      <p className="mt-2 text-sm text-red-600">{imageForm.formState.errors.image.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      Caption *
                    </label>
                    <textarea
                      {...imageForm.register('message', { required: 'Caption is required' })}
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Add a caption for your image..."
                    />
                    {imageForm.formState.errors.message && (
                      <p className="mt-2 text-sm text-red-600">{imageForm.formState.errors.message.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="altText" className="block text-sm font-medium text-gray-700">
                      Alt Text (Optional)
                    </label>
                    <input
                      {...imageForm.register('altText')}
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Describe the image for accessibility"
                    />
                  </div>

                  {isScheduled && (
                    <>
                      <div>
                        <label htmlFor="scheduleTime" className="block text-sm font-medium text-gray-700">
                          Schedule Time *
                        </label>
                        <input
                          {...imageForm.register('scheduleTime', { required: isScheduled ? 'Schedule time is required' : false })}
                          type="datetime-local"
                          min={getMinDateTime()}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        {imageForm.formState.errors.scheduleTime && (
                          <p className="mt-2 text-sm text-red-600">{imageForm.formState.errors.scheduleTime.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="recurrence" className="block text-sm font-medium text-gray-700">
                          Recurrence
                        </label>
                        <select
                          {...imageForm.register('recurrence')}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="none">No recurrence</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {isScheduled ? 'Scheduling...' : 'Publishing...'}
                        </>
                      ) : (
                        <>
                          {isScheduled ? <Calendar className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                          {isScheduled ? 'Schedule Post' : 'Publish Now'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
