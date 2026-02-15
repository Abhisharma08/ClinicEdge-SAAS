'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Building2, User, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Appointment {
    id: string
    appointmentDate: string
    startTime: string
    endTime: string
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'COMPLETED_OFFLINE' | 'CANCELLED' | 'NO_SHOW'
    doctor: {
        name: string
    }
    clinic: {
        name: string
        address: string
    }
}

export default function PatientAppointmentsPage() {
    const router = useRouter()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        if (!token) {
            router.push('/login')
            return
        }
        fetchAppointments()
    }, [])

    async function fetchAppointments() {
        try {
            const token = localStorage.getItem('accessToken')
            const res = await fetch('/api/appointments/my', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Failed to fetch appointments')
            const data = await res.json()
            setAppointments(data.items || [])
        } catch (err: any) {
            console.error(err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleCancel(id: string) {
        if (!confirm('Are you sure you want to cancel this appointment?')) return

        try {
            const token = localStorage.getItem('accessToken')
            const res = await fetch(`/api/appointments/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.message || 'Failed to cancel appointment')
            }

            // Refresh list
            fetchAppointments()
            alert('Appointment cancelled successfully')
        } catch (err: any) {
            console.error(err)
            alert(err.message)
        }
    }

    if (loading) return <div className="p-8 text-center">Loading your appointments...</div>

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
                        <p className="text-gray-500">View and manage your scheduled visits</p>
                    </div>
                    <Link href="/book" className="btn-primary">
                        Book New Appointment
                    </Link>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        {error}
                    </div>
                )}

                {appointments.length === 0 ? (
                    <div className="card p-12 text-center">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                        <p className="text-gray-500 mb-6">You haven't booked any appointments yet.</p>
                        <Link href="/book" className="btn-primary inline-flex">
                            Book Now
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {appointments.map((apt) => (
                            <div key={apt.id} className="card p-6 transition-all hover:shadow-md">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-4 md:hidden">
                                            <StatusBadge status={apt.status} />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <div className="flex items-center text-gray-900 font-semibold text-lg mb-1">
                                                    <User className="w-5 h-5 mr-2 text-primary-600" />
                                                    Dr. {apt.doctor.name}
                                                </div>
                                                <div className="flex items-center text-gray-500 mb-1">
                                                    <Building2 className="w-4 h-4 mr-2" />
                                                    {apt.clinic.name}
                                                </div>
                                                <div className="flex items-start text-gray-500 text-sm">
                                                    <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                                                    {apt.clinic.address || 'Address not available'}
                                                </div>
                                            </div>

                                            <div className="border-t pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-4">
                                                <div className="flex items-center text-gray-900 font-medium mb-2">
                                                    <Calendar className="w-5 h-5 mr-2 text-primary-600" />
                                                    {new Date(apt.appointmentDate).toLocaleDateString('en-IN', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                                <div className="flex items-center text-gray-600">
                                                    <Clock className="w-5 h-5 mr-2" />
                                                    {apt.startTime.substring(0, 5)} - {apt.endTime.substring(0, 5)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end justify-between min-w-[140px]">
                                        <div className="hidden md:block">
                                            <StatusBadge status={apt.status} />
                                        </div>

                                        {(apt.status === 'PENDING' || apt.status === 'CONFIRMED') && (
                                            <button
                                                onClick={() => handleCancel(apt.id)}
                                                className="mt-4 w-full md:w-auto px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center"
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        PENDING: 'bg-yellow-100 text-yellow-800',
        CONFIRMED: 'bg-blue-100 text-blue-800',
        COMPLETED: 'bg-green-100 text-green-800',
        COMPLETED_OFFLINE: 'bg-orange-100 text-orange-800',
        CANCELLED: 'bg-red-100 text-red-800',
        NO_SHOW: 'bg-gray-100 text-gray-800'
    }

    const labels: Record<string, string> = {
        COMPLETED_OFFLINE: 'Written Rx',
    }

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}>
            {labels[status] || status}
        </span>
    )
}
