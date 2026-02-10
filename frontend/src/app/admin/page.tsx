'use client'

import { Building2, Users, Calendar, TrendingUp } from 'lucide-react'

export default function AdminDashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-500">Welcome back, Super Admin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Clinics"
                    value="2"
                    icon={<Building2 className="w-6 h-6 text-blue-600" />}
                    bg="bg-blue-50"
                />
                <StatCard
                    title="Active Doctors"
                    value="4"
                    icon={<Users className="w-6 h-6 text-green-600" />}
                    bg="bg-green-50"
                />
                <StatCard
                    title="Total Appointments"
                    value="150+"
                    icon={<Calendar className="w-6 h-6 text-purple-600" />}
                    bg="bg-purple-50"
                />
                <StatCard
                    title="Platform Revenue"
                    value="$12k"
                    icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
                    bg="bg-orange-50"
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

function StatCard({ title, value, icon, bg }: { title: string, value: string, icon: React.ReactNode, bg: string }) {
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
