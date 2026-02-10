'use client'

import { useEffect, useState } from 'react'
import { Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'

interface DashboardStats {
    todayAppointments: number
    pendingAppointments: number
    totalPatients: number
    completedToday: number
}

interface RecentAppointment {
    id: string
    patientName: string
    doctorName: string
    time: string
    status: string
}

export default function ClinicDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    async function fetchDashboardData() {
        try {
            const today = new Date().toISOString().split('T')[0]

            // Fetch stats from real APIs
            const [todayApts, pendingApts, patients, completedApts] = await Promise.all([
                api.get<any>(`/appointments?date=${today}`),
                api.get<any>(`/appointments?status=PENDING`),
                api.get<any>(`/patients`),
                api.get<any>(`/appointments?date=${today}&status=COMPLETED`)
            ])

            setStats({
                todayAppointments: todayApts.meta.total,
                pendingAppointments: pendingApts.meta.total,
                totalPatients: patients.meta.total,
                completedToday: completedApts.meta.total,
            })

            // Fetch latest appointments
            const recentRes = await api.get<any>(`/appointments?limit=5`)

            setRecentAppointments(recentRes.items.map((apt: any) => ({
                id: apt.id,
                patientName: apt.patient.name,
                doctorName: apt.doctor.name,
                time: apt.startTime,
                status: apt.status,
            })))

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Helper to format 1970-01-01Ttime string to just time
    function formatTime(isoString: string) {
        try {
            const date = new Date(isoString)
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } catch (e) {
            return isoString
        }
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'CONFIRMED': return 'bg-blue-100 text-blue-700'
            case 'PENDING': return 'bg-yellow-100 text-yellow-700'
            case 'COMPLETED': return 'bg-green-100 text-green-700'
            case 'CANCELLED': return 'bg-red-100 text-red-700'
            default: return 'bg-gray-100 text-gray-700'
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
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Calendar className="w-6 h-6" />}
                    iconBg="bg-primary-100"
                    iconColor="text-primary-600"
                    label="Today's Appointments"
                    value={stats?.todayAppointments || 0}
                />
                <StatCard
                    icon={<Clock className="w-6 h-6" />}
                    iconBg="bg-yellow-100"
                    iconColor="text-yellow-600"
                    label="Pending"
                    value={stats?.pendingAppointments || 0}
                />
                <StatCard
                    icon={<CheckCircle className="w-6 h-6" />}
                    iconBg="bg-green-100"
                    iconColor="text-green-600"
                    label="Completed Today"
                    value={stats?.completedToday || 0}
                />
                <StatCard
                    icon={<Users className="w-6 h-6" />}
                    iconBg="bg-accent-100"
                    iconColor="text-accent-600"
                    label="Total Patients"
                    value={stats?.totalPatients || 0}
                />
            </div>

            {/* Recent Appointments */}
            <div className="card">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Today's Appointments</h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {recentAppointments.map((apt) => (
                        <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div>
                                <p className="font-medium text-gray-900">{apt.patientName}</p>
                                <p className="text-sm text-gray-500">{apt.doctorName}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-600">{formatTime(apt.time)}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                                    {apt.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-gray-100">
                    <a href="/clinic/appointments" className="text-primary-600 hover:underline text-sm font-medium">
                        View all appointments →
                    </a>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickAction
                    title="Register Patient"
                    description="Add a new patient to your clinic"
                    href="/clinic/patients?action=new"
                    icon={<Users className="w-6 h-6" />}
                />
                <QuickAction
                    title="View Pending"
                    description="Review pending appointments"
                    href="/clinic/appointments?status=PENDING"
                    icon={<AlertCircle className="w-6 h-6" />}
                />
                <QuickAction
                    title="Check Feedback"
                    description="View patient feedback"
                    href="/clinic/feedback"
                    icon={<CheckCircle className="w-6 h-6" />}
                />
            </div>
        </div>
    )
}

function StatCard({
    icon,
    iconBg,
    iconColor,
    label,
    value,
}: {
    icon: React.ReactNode
    iconBg: string
    iconColor: string
    label: string
    value: number
}) {
    return (
        <div className="card p-4">
            <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    )
}

function QuickAction({
    title,
    description,
    href,
    icon,
}: {
    title: string
    description: string
    href: string
    icon: React.ReactNode
}) {
    return (
        <a href={href} className="card-hover p-4 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <p className="font-medium text-gray-900">{title}</p>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
        </a>
    )
}
