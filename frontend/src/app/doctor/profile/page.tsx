'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { User, Mail, Phone, Award, FileText } from 'lucide-react'

export default function DoctorProfilePage() {
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchProfile()
    }, [])

    async function fetchProfile() {
        setLoading(true)
        try {
            const res = await api.get<any>('/doctors/profile/me')
            setProfile(res)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>

    if (!profile) return <div className="p-8 text-center">Profile not found</div>

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-primary-50 p-8 flex flex-col items-center border-b border-gray-100">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-primary-600 shadow-sm mb-4">
                        {profile.name.charAt(0)}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                    <p className="text-primary-600 font-medium">{profile.qualification}</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1 uppercase">
                                <Mail className="w-3 h-3" /> Email
                            </label>
                            <p className="text-gray-900 font-medium">{profile.user?.email}</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1 uppercase">
                                <Phone className="w-3 h-3" /> Phone
                            </label>
                            <p className="text-gray-900 font-medium">{profile.phone}</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1 uppercase">
                                <Award className="w-3 h-3" /> License Number
                            </label>
                            <p className="text-gray-900 font-medium">{profile.licenseNumber}</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1 uppercase">
                                <FileText className="w-3 h-3" /> Specialists
                            </label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {profile.specialists?.length > 0 ? (
                                    profile.specialists.map((s: any) => (
                                        <span key={s.id} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-sm rounded">
                                            {s.name}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-400 text-sm">None</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">
                        To update your profile details, please contact the clinic administrator.
                    </p>
                </div>
            </div>
        </div>
    )
}
