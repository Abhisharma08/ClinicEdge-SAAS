'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    Building2,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
} from 'lucide-react'

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (!storedUser) {
            router.push('/login')
            return
        }

        const userData = JSON.parse(storedUser)
        if (userData.role !== 'SUPER_ADMIN') {
            router.push('/login')
            return
        }

        setUser(userData)
    }, [])

    function handleLogout() {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        router.push('/login')
    }

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
        { icon: Building2, label: 'Clinics', href: '/admin/clinics' },
        { icon: Users, label: 'Global Users', href: '/admin/users' },
        { icon: Settings, label: 'Settings', href: '/admin/settings' },
    ]

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-200 lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                            <span className="text-white font-bold">A</span>
                        </div>
                        <span className="font-bold text-lg">Clinic Edge</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1 hover:bg-gray-800 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    <div className="mb-4 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Super Admin
                    </div>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-3 py-2 w-full rounded-lg text-red-400 hover:bg-red-900/20 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

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
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="ml-auto flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-primary-600 text-sm font-medium">
                                    {user?.email?.[0]?.toUpperCase() || 'A'}
                                </span>
                            </div>
                            <span className="text-sm font-medium text-gray-700 hidden md:block">
                                {user?.email}
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
