'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Building2, Clock, Save, Settings, AlertCircle, Bell } from 'lucide-react'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [clinic, setClinic] = useState<any>(null)

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        googleReviewUrl: '',
    })

    const [settingsData, setSettingsData] = useState({
        slotDuration: 30,
        cancelBeforeHours: 4,
        bookingAdvanceDays: 30,
        notificationsEnabled: true,
        operatingHours: {} as Record<string, { start: string; end: string; isOpen: boolean }>
    })

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            const parsedUser = JSON.parse(userData)
            setUser(parsedUser)
            if (parsedUser.clinicId) {
                fetchClinic(parsedUser.clinicId)
            }
        }
    }, [])

    async function fetchClinic(clinicId: string) {
        setLoading(true)
        try {
            const res = await api.get<any>(`/clinics/${clinicId}`)
            setClinic(res)
            setFormData({
                name: res.name,
                phone: res.phone || '',
                address: res.address || '',
                googleReviewUrl: res.googleReviewUrl || '',
            })

            // Initialize settings with defaults if missing
            const settings = res.settings || {}
            const defaultHours = DAYS.reduce((acc, day) => ({
                ...acc,
                [day]: { start: '09:00', end: '17:00', isOpen: day !== 'sunday' }
            }), {})

            setSettingsData({
                slotDuration: settings.slotDuration || 30,
                cancelBeforeHours: settings.cancelBeforeHours || 4,
                bookingAdvanceDays: settings.bookingAdvanceDays || 30,
                notificationsEnabled: settings.notificationsEnabled !== false,
                operatingHours: settings.operatingHours || defaultHours,
            })

        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        try {
            const payload = {
                ...formData,
                settings: settingsData
            }
            await api.put(`/clinics/${user.clinicId}`, payload)
            alert('Settings updated successfully')
        } catch (error: any) {
            console.error(error)
            const msg = error.response?.data?.message || 'Failed to update settings'
            alert(msg)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-8 text-center">Loading settings...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Clinic Settings</h1>
                <p className="text-gray-500">Manage your clinic profile and operating preferences</p>
            </div>

            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'profile'
                        ? 'text-black border-b-2 border-black'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Building2 size={16} />
                        <span>Profile & Contact</span>
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('hours')}
                    className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'hours'
                        ? 'text-black border-b-2 border-black'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>Operating Hours & Policies</span>
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'notifications'
                        ? 'text-black border-b-2 border-black'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Bell size={16} />
                        <span>Notifications</span>
                    </div>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {activeTab === 'profile' && (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Clinic Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 focus:ring-black focus:border-black"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 focus:ring-black focus:border-black"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 focus:ring-black focus:border-black"
                                    rows={3}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Google Review URL
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={formData.googleReviewUrl}
                                        onChange={(e) => setFormData({ ...formData, googleReviewUrl: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 focus:ring-black focus:border-black"
                                        placeholder="https://g.page/..."
                                    />
                                    {formData.googleReviewUrl && (
                                        <a
                                            href={formData.googleReviewUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Test
                                        </a>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Used for collecting feedback from patients</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'hours' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                <Settings size={20} />
                                <span>Booking Policies</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Slot Duration (min)
                                    </label>
                                    <select
                                        value={settingsData.slotDuration}
                                        onChange={(e) => setSettingsData({ ...settingsData, slotDuration: Number(e.target.value) })}
                                        className="w-full rounded-lg border-gray-300 focus:ring-black focus:border-black"
                                    >
                                        <option value={15}>15 minutes</option>
                                        <option value={20}>20 minutes</option>
                                        <option value={30}>30 minutes</option>
                                        <option value={45}>45 minutes</option>
                                        <option value={60}>1 hour</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cancel Before (hours)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={72}
                                        value={settingsData.cancelBeforeHours}
                                        onChange={(e) => setSettingsData({ ...settingsData, cancelBeforeHours: Number(e.target.value) })}
                                        className="w-full rounded-lg border-gray-300 focus:ring-black focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Booking Window (days)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={90}
                                        value={settingsData.bookingAdvanceDays}
                                        onChange={(e) => setSettingsData({ ...settingsData, bookingAdvanceDays: Number(e.target.value) })}
                                        className="w-full rounded-lg border-gray-300 focus:ring-black focus:border-black"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                <Clock size={20} />
                                <span>Operating Hours</span>
                            </h3>
                            <div className="space-y-4">
                                {DAYS.map((day) => {
                                    const schedule = settingsData.operatingHours[day] || { start: '09:00', end: '17:00', isOpen: false }
                                    return (
                                        <div key={day} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                                            <div className="w-24 font-medium capitalize text-gray-700">{day}</div>
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={schedule.isOpen}
                                                    onChange={(e) => {
                                                        const newHours = { ...settingsData.operatingHours }
                                                        if (!newHours[day]) newHours[day] = { start: '09:00', end: '17:00', isOpen: false }
                                                        newHours[day].isOpen = e.target.checked
                                                        setSettingsData({ ...settingsData, operatingHours: newHours })
                                                    }}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                                            </label>

                                            {schedule.isOpen ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="time"
                                                        value={schedule.start}
                                                        onChange={(e) => {
                                                            const newHours = { ...settingsData.operatingHours }
                                                            newHours[day].start = e.target.value
                                                            setSettingsData({ ...settingsData, operatingHours: newHours })
                                                        }}
                                                        className="rounded-lg border-gray-300 focus:ring-black focus:border-black"
                                                    />
                                                    <span className="text-gray-400">to</span>
                                                    <input
                                                        type="time"
                                                        value={schedule.end}
                                                        onChange={(e) => {
                                                            const newHours = { ...settingsData.operatingHours }
                                                            newHours[day].end = e.target.value
                                                            setSettingsData({ ...settingsData, operatingHours: newHours })
                                                        }}
                                                        className="rounded-lg border-gray-300 focus:ring-black focus:border-black"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm italic">Closed</span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
                        <p className="text-sm text-gray-500">Control email and WhatsApp notifications for appointments, reminders, and feedback requests.</p>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div>
                                <p className="font-medium text-gray-900">Enable Notifications</p>
                                <p className="text-sm text-gray-500">
                                    When enabled, patients and doctors will receive email and WhatsApp notifications for bookings, confirmations, reminders, and feedback requests.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSettingsData({ ...settingsData, notificationsEnabled: !settingsData.notificationsEnabled })}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settingsData.notificationsEnabled ? 'bg-black' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settingsData.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>

                        {!settingsData.notificationsEnabled && (
                            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertCircle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-amber-800">Notifications are disabled</p>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Patients will not receive booking confirmations, reminders, or feedback requests via email or WhatsApp. Dashboard notifications will still appear.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50"
                    >
                        <Save size={20} />
                        <span>{submitting ? 'Saving Changes...' : 'Save Changes'}</span>
                    </button>
                </div>
            </form>
        </div>
    )
}
