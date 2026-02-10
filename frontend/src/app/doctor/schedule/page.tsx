'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Clock, Calendar, Edit2, Save, X, Check } from 'lucide-react'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

interface DaySchedule {
    startTime: string
    endTime: string
    slotDuration: number
    off?: boolean
}

interface Schedule {
    [key: string]: DaySchedule
}

export default function MySchedulePage() {
    const [schedule, setSchedule] = useState<Schedule | null>(null)
    const [loading, setLoading] = useState(true)
    const [doctor, setDoctor] = useState<any>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editSchedule, setEditSchedule] = useState<Schedule>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchSchedule()
    }, [])

    async function fetchSchedule() {
        setLoading(true)
        try {
            const profile = await api.get<any>('/doctors/profile/me')
            setDoctor(profile)

            if (profile.clinics && profile.clinics.length > 0) {
                const mainClinic = profile.clinics[0]
                const currentSchedule = mainClinic.schedule || {}
                setSchedule(currentSchedule)
                setEditSchedule(JSON.parse(JSON.stringify(currentSchedule)))
            }
        } catch (error) {
            console.error('Failed to load schedule', error)
        } finally {
            setLoading(false)
        }
    }

    function handleDayChange(day: string, field: keyof DaySchedule, value: any) {
        setEditSchedule(prev => ({
            ...prev,
            [day]: {
                ...(prev[day] || { startTime: '09:00', endTime: '17:00', slotDuration: 30 }),
                [field]: value
            }
        }))
    }

    function toggleDayOff(day: string) {
        setEditSchedule(prev => {
            const current = prev[day] || { startTime: '09:00', endTime: '17:00', slotDuration: 30 }
            return {
                ...prev,
                [day]: { ...current, off: !current.off }
            }
        })
    }

    async function saveSchedule() {
        if (!doctor || !doctor.id) return
        setSaving(true)
        try {
            // Filter out 'off' days if backend expects them missing? 
            // Or keep them with off flag? Backend schema is JSON, so it persists whatever.
            // Let's persist them with "off": true to be explicit.

            await api.put(`/doctors/${doctor.id}/schedule`, editSchedule)
            setSchedule(editSchedule)
            setIsEditing(false)
            alert('Schedule updated successfully')
        } catch (error) {
            console.error('Failed to save schedule', error)
            alert('Failed to save schedule')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading schedule...</div>

    if (!schedule && !isEditing) return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
                <button
                    onClick={() => setIsEditing(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Edit2 className="w-4 h-4" /> Setup Schedule
                </button>
            </div>
            <div className="p-8 text-center text-gray-500 bg-white rounded-lg border">
                No schedule found. Click "Setup Schedule" to configure your working hours.
            </div>
        </div>
    )

    return (
        <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    My Weekly Schedule
                </h1>
                {!isEditing ? (
                    <button
                        onClick={() => {
                            setEditSchedule(JSON.parse(JSON.stringify(schedule)))
                            setIsEditing(true)
                        }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Edit2 className="w-4 h-4" /> Edit Schedule
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="btn-secondary flex items-center gap-2"
                            disabled={saving}
                        >
                            <X className="w-4 h-4" /> Cancel
                        </button>
                        <button
                            onClick={saveSchedule}
                            className="btn-primary flex items-center gap-2"
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <p className="text-gray-600">
                        Your current working hours at <span className="font-medium text-gray-900">{doctor?.clinics?.[0]?.name}</span>.
                    </p>
                </div>
                <div className="divide-y divide-gray-100">
                    {DAYS.map((day) => {
                        const currentData = isEditing ? (editSchedule[day] || { startTime: '09:00', endTime: '17:00', slotDuration: 30 }) : (schedule?.[day] || { startTime: '09:00', endTime: '17:00', slotDuration: 30 })
                        const isOff = isEditing ? !!editSchedule[day]?.off : !!schedule?.[day]?.off

                        // If not editing and day is missing in schedule, treat as OFF
                        const isMissing = !isEditing && !schedule?.[day]
                        const effectivelyOff = isOff || isMissing

                        return (
                            <div key={day} className={`p-4 flex items-center justify-between hover:bg-gray-50 ${isEditing && effectivelyOff ? 'bg-gray-50' : ''}`}>
                                <div className="w-32 font-medium capitalize flex items-center gap-2">
                                    <Clock className={`w-4 h-4 ${effectivelyOff ? 'text-gray-300' : 'text-gray-400'}`} />
                                    <span className={effectivelyOff ? 'text-gray-400' : 'text-gray-900'}>{day}</span>
                                </div>

                                {isEditing ? (
                                    <div className="flex-1 flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={!effectivelyOff}
                                                    onChange={() => toggleDayOff(day)}
                                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                />
                                                <span className="text-sm text-gray-600">Working</span>
                                            </label>
                                        </div>

                                        {!effectivelyOff && (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="time"
                                                        value={currentData.startTime}
                                                        onChange={(e) => handleDayChange(day, 'startTime', e.target.value)}
                                                        className="input py-1 px-2 text-sm"
                                                    />
                                                    <span className="text-gray-400">-</span>
                                                    <input
                                                        type="time"
                                                        value={currentData.endTime}
                                                        onChange={(e) => handleDayChange(day, 'endTime', e.target.value)}
                                                        className="input py-1 px-2 text-sm"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-500">Duration:</span>
                                                    <select
                                                        value={currentData.slotDuration}
                                                        onChange={(e) => handleDayChange(day, 'slotDuration', parseInt(e.target.value))}
                                                        className="input py-1 px-2 text-sm"
                                                    >
                                                        <option value={15}>15 min</option>
                                                        <option value={20}>20 min</option>
                                                        <option value={30}>30 min</option>
                                                        <option value={45}>45 min</option>
                                                        <option value={60}>60 min</option>
                                                    </select>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center gap-4">
                                        {!effectivelyOff ? (
                                            <>
                                                <div className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-700 font-mono">
                                                    {currentData.startTime}
                                                </div>
                                                <span className="text-gray-400">-</span>
                                                <div className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-700 font-mono">
                                                    {currentData.endTime}
                                                </div>
                                                <span className="text-xs text-gray-400 ml-2">
                                                    ({currentData.slotDuration} min slots)
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-gray-400 text-sm italic">Day Off</span>
                                        )}
                                    </div>
                                )}

                                <div>
                                    {!effectivelyOff ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Working
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            Off
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
