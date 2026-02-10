'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function CreateClinicPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const token = localStorage.getItem('accessToken')
            const res = await fetch('/api/clinics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || 'Failed to create clinic')
            }

            router.push('/admin/clinics')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center space-x-4 mb-6">
                <Link href="/admin/clinics" className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Add New Clinic</h1>
            </div>

            <div className="card p-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
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
                                    placeholder="e.g. HealthFirst Medical Center"
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
                                    placeholder="Full address"
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
                                    placeholder="+91-98765-43210"
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
                                    placeholder="contact@clinic.com"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="label">Google Review URL (Optional)</label>
                                <input
                                    type="url"
                                    className="input"
                                    value={formData.googleReviewUrl}
                                    onChange={e => setFormData({ ...formData, googleReviewUrl: e.target.value })}
                                    placeholder="https://g.page/..."
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
                                <span>Creating...</span>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>Create Clinic</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
