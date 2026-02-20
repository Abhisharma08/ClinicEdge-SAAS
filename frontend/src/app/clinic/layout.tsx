'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    Calendar,
    Users,
    UserCog,
    Bell,
    Star,
    Settings,
    LogOut,
    Menu,
    X,
    MessageSquare,
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

interface User {
    id: string
    email: string
    role: string
    clinicId?: string
}

export default function ClinicDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { unreadCount } = useNotifications()

    useEffect(() => {
        const stored = localStorage.getItem('user')
        if (!stored) {
            router.push('/login')
            return
        }
        const parsed = JSON.parse(stored)
        if (parsed.role !== 'CLINIC_ADMIN') {
            router.push('/login')
            return
        }
        setUser(parsed)
    }, [])

    function handleLogout() {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        router.push('/login')
    }

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/clinic' },
        { icon: Calendar, label: 'Appointments', href: '/clinic/appointments' },
        { icon: Users, label: 'Patients', href: '/clinic/patients' },
        { icon: UserCog, label: 'Doctors', href: '/clinic/doctors' },
        { icon: Bell, label: 'Notifications', href: '/clinic/notifications', badge: unreadCount },
        { icon: Star, label: 'Feedback', href: '/clinic/feedback' },
        { icon: MessageSquare, label: 'Campaigns', href: '/clinic/campaigns' },
        { icon: Settings, label: 'Settings', href: '/clinic/settings' },
    ]

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            {/* Sidebar - Only for Clinic Admin */}
            {user?.role === 'CLINIC_ADMIN' ? (
                <aside
                    className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                                <span className="text-white font-bold">C</span>
                            </div>
                            <span className="font-bold text-gray-900">Clinic Admin</span>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 hover:bg-gray-100 rounded"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="p-4 space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors group"
                            >
                                <div className="flex items-center space-x-3">
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </div>
                                {item.badge && item.badge > 0 ? (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {item.badge}
                                    </span>
                                ) : null}
                            </Link>
                        ))}
                    </nav>

                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 px-3 py-2 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </aside>
            ) : null}

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:px-6">
                    {user?.role === 'CLINIC_ADMIN' && (
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    )}

                    <div className="flex items-center space-x-4 ml-auto">
                        {/* Notification Bell in Header */}
                        <div className="relative">
                            <Bell className="w-6 h-6 text-gray-500" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                        </div>

                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 text-sm font-medium">
                                {user?.email?.[0]?.toUpperCase() || 'U'}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
