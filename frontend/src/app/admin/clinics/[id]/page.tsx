'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function EditClinicPage() {
    const router = useRouter()
    const params = useParams()
    const clinicId = params.id as string

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        googleReviewUrl: '',
        settings: {
            timezone: 'Asia/Kolkata',
            slotDuration: 30,
            bookingAdvanceDays: 30,
            cancelBeforeHours: 4,
        }
    })

    useEffect(() => {
        if (!clinicId) return
        fetchClinicDetails()
    }, [clinicId])

    async function fetchClinicDetails() {
        try {
            const data = await api.get<any>(`/clinics/${clinicId}`)
            setFormData({
                name: data.name || '',
                address: data.address || '',
                phone: data.phone || '',
                email: data.email || '',
                googleReviewUrl: data.googleReviewUrl || '',
                settings: {
                    timezone: data.settings?.timezone || 'Asia/Kolkata',
                    slotDuration: data.settings?.slotDuration || 30,
                    bookingAdvanceDays: data.settings?.bookingAdvanceDays || 30,
                    cancelBeforeHours: data.settings?.cancelBeforeHours || 4,
                }
            })
        } catch (err: any) {
            setError(err.message || 'Failed to load clinic details')
        } finally {
            setFetching(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await api.put(`/clinics/${clinicId}`, formData)
            router.push('/admin/clinics')
        } catch (err: any) {
            setError(err.message || 'Failed to update clinic')
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return <div className="text-center py-10">Loading clinic metadata...</div>
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center space-x-4 mb-6">
                <Link href="/admin/clinics" className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Edit Clinic</h1>
            </div>

            <div className="card p-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg whitespace-pre-wrap">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b pb-2">Basic Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="label">Clinic Name</label>
                                <input
                                    type="text"
                                    required
                                    className="input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="label">Address</label>
                                <textarea
                                    required
                                    className="input"
                                    rows={3}
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="label">Phone Number</label>
                                <input
                                    type="text"
                                    required
                                    className="input"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div>
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
                                <label className="label">Google Review URL (Optional)</label>
                                <input
                                    type="url"
                                    className="input"
                                    value={formData.googleReviewUrl}
                                    onChange={e => setFormData({ ...formData, googleReviewUrl: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="space-y-4 pt-4">
                        <h3 className="font-semibold text-gray-900 border-b pb-2">Default Settings</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Slot Duration (mins)</label>
                                <input
                                    type="number"
                                    required
                                    min="10"
                                    step="5"
                                    className="input"
                                    value={formData.settings.slotDuration}
                                    onChange={e => setFormData({
                                        ...formData,
                                        settings: { ...formData.settings, slotDuration: parseInt(e.target.value) }
                                    })}
                                />
                            </div>

                            <div>
                                <label className="label">Booking Advance (days)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    className="input"
                                    value={formData.settings.bookingAdvanceDays}
                                    onChange={e => setFormData({
                                        ...formData,
                                        settings: { ...formData.settings, bookingAdvanceDays: parseInt(e.target.value) }
                                    })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
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
