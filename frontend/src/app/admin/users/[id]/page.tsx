'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface Clinic {
    id: string
    name: string
}

export default function EditUserPage() {
    const router = useRouter()
    const params = useParams()
    const userId = params.id as string

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [clinicsLoading, setClinicsLoading] = useState(true)
    const [clinics, setClinics] = useState<Clinic[]>([])
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        email: '',
        password: '', // Optional on edit
        role: 'CLINIC_ADMIN',
        clinicId: ''
    })

    useEffect(() => {
        fetchClinics()
        if (userId) {
            fetchUserDetails()
        }
    }, [userId])

    async function fetchClinics() {
        try {
            const data = await api.get<any>('/clinics?take=100')
            setClinics(data.items || [])
        } catch (error) {
            console.error('Failed to fetch clinics:', error)
        } finally {
            setClinicsLoading(false)
        }
    }

    async function fetchUserDetails() {
        try {
            const data = await api.get<any>(`/users/${userId}`)
            setFormData({
                email: data.email || '',
                password: '', // Leave blank so we don't overwrite unless they type one
                role: data.role || 'CLINIC_ADMIN',
                clinicId: data.clinicId || ''
            })
        } catch (err: any) {
            setError(err.message || 'Failed to load user details')
        } finally {
            setFetching(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const payload = { ...formData }

            if (payload.role !== 'SUPER_ADMIN' && !payload.clinicId) {
                throw new Error('Clinic is required for this role')
            }
            if (payload.role === 'SUPER_ADMIN') {
                delete (payload as any).clinicId
            }
            if (!payload.password) {
                delete (payload as any).password
            }

            await api.put(`/users/${userId}`, payload)
            router.push('/admin/users')
        } catch (err: any) {
            setError(err.message || 'Failed to update user')
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return <div className="text-center py-10">Loading user metadata...</div>
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center space-x-4 mb-6">
                <Link href="/admin/users" className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
            </div>

            <div className="card p-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg whitespace-pre-wrap">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b pb-2">User Details</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="label">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="input"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="label">New Password (Optional)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Leave blank to keep unchanged"
                                />
                                <p className="text-xs text-gray-500 mt-1">Must be at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.</p>
                            </div>

                            <div>
                                <label className="label">Role</label>
                                <select
                                    required
                                    className="input"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                    <option value="CLINIC_ADMIN">Clinic Admin</option>
                                    <option value="DOCTOR">Doctor</option>
                                </select>
                            </div>

                            {formData.role !== 'SUPER_ADMIN' && (
                                <div>
                                    <label className="label">Assign to Clinic</label>
                                    <select
                                        required
                                        className="input"
                                        value={formData.clinicId}
                                        onChange={e => setFormData({ ...formData, clinicId: e.target.value })}
                                        disabled={clinicsLoading}
                                    >
                                        <option value="">Select a clinic...</option>
                                        {clinics.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 border-t flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || clinicsLoading}
                            className="btn-primary px-8 py-2.5 flex items-center space-x-2"
                        >
                            {loading ? (
                                <span>Saving...</span>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
