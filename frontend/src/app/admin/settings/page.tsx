'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { User, Mail, Shield, Clock } from 'lucide-react'

interface UserProfile {
    id: string
    email: string
    role: string
    isActive: boolean
    createdAt: string
    lastLoginAt: string | null
}

export default function AdminSettingsPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchProfile()
    }, [])

    async function fetchProfile() {
        try {
            const res = await api.get<any>('/users/me')
            setProfile(res)
        } catch (error) {
            console.error('Failed to fetch profile:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500">Your admin profile and system information</p>
            </div>

            {/* Admin Profile */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-900 p-8 flex flex-col items-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-gray-900 shadow-sm mb-4">
                        {profile?.email?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <h2 className="text-xl font-bold text-white">{profile?.email}</h2>
                    <span className="mt-2 px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm font-medium">
                        Super Admin
                    </span>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1 uppercase">
                                <Mail className="w-3 h-3" /> Email
                            </label>
                            <p className="text-gray-900 font-medium">{profile?.email}</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1 uppercase">
                                <Shield className="w-3 h-3" /> Role
                            </label>
                            <p className="text-gray-900 font-medium">{profile?.role?.replace('_', ' ')}</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1 uppercase">
                                <User className="w-3 h-3" /> Account Status
                            </label>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${profile?.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {profile?.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1 uppercase">
                                <Clock className="w-3 h-3" /> Last Login
                            </label>
                            <p className="text-gray-900 font-medium">
                                {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-lg text-gray-900 mb-4">System Information</h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-gray-600">Application</span>
                        <span className="font-medium text-gray-900">ClinicEdge</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-gray-600">Environment</span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            {process.env.NODE_ENV || 'development'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Account Created</span>
                        <span className="font-medium text-gray-900">
                            {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
