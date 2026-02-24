'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Save } from 'lucide-react'
import Link from 'next/link'

interface Clinic {
    id: string
    name: string
}

export default function CreateUserPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [clinicsLoading, setClinicsLoading] = useState(true)
    const [clinics, setClinics] = useState<Clinic[]>([])
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'CLINIC_ADMIN',
        clinicId: ''
    })

    useEffect(() => {
        fetchClinics()
    }, [])

    async function fetchClinics() {
        try {
            const token = localStorage.getItem('accessToken')
            const res = await fetch('/api/clinics?take=100', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            setClinics(data.items || [])
        } catch (error) {
            console.error('Failed to fetch clinics:', error)
        } finally {
            setClinicsLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const token = localStorage.getItem('accessToken')
            const payload = { ...formData }

            if (payload.role !== 'SUPER_ADMIN' && !payload.clinicId) {
                throw new Error('Clinic is required for this role')
            }
            if (payload.role === 'SUPER_ADMIN') {
                delete (payload as any).clinicId
            }

            const res = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || 'Failed to create user')
            }

            router.push('/admin/users')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center space-x-4 mb-6">
                <Link href="/admin/users" className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Add New User</h1>
            </div>

            <div className="card p-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
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
                                    placeholder="admin@clinic.com"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="label">Initial Password</label>
                                <input
                                    type="text"
                                    required
                                    className="input"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="SecurePass@123"
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
                                <span>Creating...</span>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>Create User</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
