'use client'

import { useEffect, useState } from 'react'
import { Building2, Users, UserCog, Activity } from 'lucide-react'
import { api } from '@/lib/api'

interface AdminStats {
    totalClinics: number
    totalDoctors: number
    totalUsers: number
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    async function fetchStats() {
        try {
            const [clinicsRes, doctorsRes, usersRes] = await Promise.all([
                api.get<any>('/clinics?limit=1'),
                api.get<any>('/users?role=DOCTOR&limit=1'),
                api.get<any>('/users?limit=1'),
            ])

            setStats({
                totalClinics: clinicsRes.meta?.total ?? 0,
                totalDoctors: doctorsRes.meta?.total ?? 0,
                totalUsers: usersRes.meta?.total ?? 0,
            })
        } catch (error) {
            console.error('Failed to fetch admin stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-500">Welcome back, Super Admin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Total Clinics"
                    value={stats?.totalClinics ?? 0}
                    icon={<Building2 className="w-6 h-6 text-blue-600" />}
                    bg="bg-blue-50"
                />
                <StatCard
                    title="Active Doctors"
                    value={stats?.totalDoctors ?? 0}
                    icon={<UserCog className="w-6 h-6 text-green-600" />}
                    bg="bg-green-50"
                />
                <StatCard
                    title="Total Users"
                    value={stats?.totalUsers ?? 0}
                    icon={<Users className="w-6 h-6 text-purple-600" />}
                    bg="bg-purple-50"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6">
                    <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <a href="/admin/clinics/new" className="block w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors font-medium">
                            + Onboard New Clinic
                        </a>
                        <a href="/admin/users" className="block w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors font-medium">
                            Manage Global Users
                        </a>
                    </div>
                </div>

                <div className="card p-6">
                    <h3 className="font-semibold text-lg mb-4">System Health</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">API Status</span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Operational</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Database</span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Connected</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Storage</span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Healthy</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon, bg }: { title: string, value: number, icon: React.ReactNode, bg: string }) {
    return (
        <div className="card p-6 flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${bg}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>
        </div>
    )
}
