'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../lib/utils'
import { 
  Calendar, 
  FileText, 
  Home, 
  Settings, 
  BarChart3,
  Facebook,
  PlusCircle,
  Clock
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: Home },
  { name: 'Create Post', href: '/dashboard/create', icon: PlusCircle },
  { name: 'Scheduled Posts', href: '/dashboard/scheduled', icon: Clock },
  { name: 'Post History', href: '/dashboard/history', icon: FileText },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 z-50 flex w-72 flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 ring-1 ring-gray-900/5">
          <div className="flex h-16 shrink-0 items-center">
            <Facebook className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">
              Facebook Automation
            </span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            isActive
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600',
                            'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors'
                          )}
                        >
                          <item.icon
                            className={cn(
                              isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600',
                              'h-6 w-6 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-72">
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
