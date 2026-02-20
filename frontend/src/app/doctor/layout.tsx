'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Calendar, Users, FileText, Bell, Settings, LogOut, Menu, X, MessageSquare } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

export default function DoctorDashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { unreadCount } = useNotifications()

    useEffect(() => {
        const user = localStorage.getItem('user')
        if (!user || JSON.parse(user).role !== 'DOCTOR') {
            router.push('/login')
        }
    }, [])

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/doctor' },
        { icon: Calendar, label: 'My Schedule', href: '/doctor/schedule' },
        { icon: Calendar, label: 'Appointments', href: '/doctor/appointments' },
        { icon: Users, label: 'Patients', href: '/doctor/patients' },
        { icon: FileText, label: 'Records', href: '/doctor/records' },
        { icon: Bell, label: 'Notifications', href: '/doctor/notifications', badge: unreadCount },
        { icon: MessageSquare, label: 'Campaigns', href: '/doctor/campaigns' },
        { icon: Settings, label: 'Profile', href: '/doctor/profile' },
    ]

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <span className="font-bold text-white">Doctor Portal</span>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400"><X /></button>
                </div>
                <nav className="p-4 space-y-1">
                    {navItems.map(item => (
                        <Link key={item.href} href={item.href} className="flex items-center justify-between px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800">
                            <div className="flex items-center space-x-3">
                                <item.icon className="w-5 h-5" /><span>{item.label}</span>
                            </div>
                            {item.badge && item.badge > 0 ? (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {item.badge}
                                </span>
                            ) : null}
                        </Link>
                    ))}
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
                    <button onClick={() => { localStorage.clear(); router.push('/login'); }} className="flex items-center space-x-3 px-3 py-2 w-full text-red-400 hover:bg-red-900/20 rounded-lg">
                        <LogOut className="w-5 h-5" /><span>Logout</span>
                    </button>
                </div>
            </aside>
            {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
            <div className="flex-1 flex flex-col">
                <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu /></button>

                    <div className="flex items-center space-x-4 ml-auto">
                        <div className="relative">
                            <Bell className="w-6 h-6 text-gray-600" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white">D</div>
                    </div>
                </header>
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    )
}
