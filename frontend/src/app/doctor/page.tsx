'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Calendar, Users, Clock, CheckCircle, Plus, X, Search, UserPlus, Loader2 } from 'lucide-react'

export default function DoctorDashboardPage() {
    const [stats, setStats] = useState({ todayAppointments: 0, pending: 0, completed: 0, totalPatients: 0 })
    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [doctorName, setDoctorName] = useState('')
    const [profile, setProfile] = useState<any>(null)
    const [bookingModalOpen, setBookingModalOpen] = useState(false)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    async function fetchDashboardData() {
        setLoading(true)
        try {
            // 1. Get My Profile (Doctor ID)
            const profile = await api.get<any>('/doctors/profile/me')
            setDoctorName(profile.name)
            setProfile(profile)
            const doctorId = profile.id

            // 2. Get Today's Appointments
            const today = new Date().toISOString().split('T')[0]
            const aptRes = await api.get<any>(`/doctors/${doctorId}/appointments?date=${today}&limit=50`)
            console.log('DASHBOARD DEBUG: Upcoming Appointments Response', aptRes);
            console.log('DASHBOARD DEBUG: Items', aptRes?.items);

            const todaysApts = aptRes.items || [] // Add fallback
            setAppointments(todaysApts)

            // 3. Calculate Stats
            const pending = todaysApts.filter((a: any) => a.status === 'PENDING' || a.status === 'CONFIRMED').length
            const completed = todaysApts.filter((a: any) => a.status === 'COMPLETED').length

            // 4. Get Total Patients (Clinic Scoped)
            // Doctor can access GET /patients
            const patRes = await api.get<any>('/patients?limit=1')
            const totalPatients = patRes.meta.total

            setStats({
                todayAppointments: todaysApts.length,
                pending,
                completed,
                totalPatients
            })

        } catch (error) {
            console.error('Failed to load dashboard data', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Good Morning, Dr. {doctorName}</h1>
                    <p className="text-gray-600">Here's your schedule for today</p>
                </div>
                <button
                    onClick={() => setBookingModalOpen(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Book Appointment
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<Calendar />} label="Today" value={stats.todayAppointments} />
                <StatCard icon={<Clock />} label="Pending" value={stats.pending} />
                <StatCard icon={<CheckCircle />} label="Completed" value={stats.completed} />
                <StatCard icon={<Users />} label="Total Patients" value={stats.totalPatients} />
            </div>

            <div className="card">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-semibold text-gray-900">Upcoming Appointments</h2>
                    <button onClick={fetchDashboardData} className="text-sm text-primary-600 hover:text-primary-700">Refresh</button>
                </div>
                <div className="divide-y divide-gray-100">
                    {appointments.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No upcoming appointments</div>
                    ) : (
                        appointments.map(apt => (
                            <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">{apt.patient?.name || 'Unknown Patient'}</p>
                                    <p className="text-sm text-gray-500">{apt.notes || 'No notes'}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-right">
                                        <div className="font-medium text-gray-900">
                                            {(() => {
                                                try {
                                                    const d = new Date(apt.appointmentDate);
                                                    const t = new Date(apt.startTime);
                                                    if (isNaN(d.getTime()) || isNaN(t.getTime())) return 'Invalid Date';
                                                    return `${d.toLocaleDateString()} ${t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                } catch (e) { return 'Date Error' }
                                            })()}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {apt.type || 'Visit'}
                                        </div>
                                    </div>
                                    <StatusBadge status={apt.status} />
                                    {apt.status === 'COMPLETED' ? (
                                        <a href={`/doctor/consultations/${apt.id}`} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 no-underline">
                                            View Details
                                        </a>
                                    ) : apt.status === 'CANCELLED' ? (
                                        <span className="text-sm text-gray-500 font-medium px-3">Cancelled</span>
                                    ) : (
                                        <a href={`/doctor/consultations/${apt.id}`} className="btn-primary text-sm py-1.5 px-3 no-underline">
                                            Start Visit
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>



            <BookAppointmentModal
                isOpen={bookingModalOpen}
                onClose={() => setBookingModalOpen(false)}
                doctorId={profile?.id}
                onSuccess={() => {
                    fetchDashboardData()
                    setBookingModalOpen(false)
                }}
            />
        </div>
    )
}

function BookAppointmentModal({ isOpen, onClose, doctorId, onSuccess }: { isOpen: boolean, onClose: () => void, doctorId?: string, onSuccess: () => void }) {
    const [patients, setPatients] = useState<any[]>([])
    const [slots, setSlots] = useState<any[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    
    // Patient selection state
    const [patientMode, setPatientMode] = useState<'search' | 'existing' | 'new'>('search')
    const [phoneSearch, setPhoneSearch] = useState('')
    const [phoneSearchLoading, setPhoneSearchLoading] = useState(false)
    const [foundPatient, setFoundPatient] = useState<any>(null)
    const [newPatientName, setNewPatientName] = useState('')
    const [newPatientEmail, setNewPatientEmail] = useState('')
    const [patientSearch, setPatientSearch] = useState('')

    const [formData, setFormData] = useState({
        patientId: '',
        appointmentDate: new Date().toISOString().split('T')[0],
        startTime: '',
        notes: ''
    })

    useEffect(() => {
        if (isOpen) {
            fetchInitialData()
            resetForm()
        }
    }, [isOpen])

    useEffect(() => {
        if (isOpen && doctorId && formData.appointmentDate) {
            fetchSlots()
        }
    }, [isOpen, doctorId, formData.appointmentDate])

    // Phone search with debounce
    useEffect(() => {
        if (patientMode !== 'search' || !phoneSearch || phoneSearch.length < 4) {
            setFoundPatient(null)
            return
        }

        const timer = setTimeout(async () => {
            setPhoneSearchLoading(true)
            try {
                const result = await api.get<any>(`/patients/search-phone?phone=${encodeURIComponent(phoneSearch)}`)
                if (result && result.id) {
                    setFoundPatient(result)
                    setPatientMode('existing')
                    setFormData(prev => ({ ...prev, patientId: result.id }))
                } else {
                    setFoundPatient(null)
                }
            } catch {
                setFoundPatient(null)
            } finally {
                setPhoneSearchLoading(false)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [phoneSearch, patientMode])

    async function fetchInitialData() {
        try {
            const res = await api.get<any>('/patients?limit=200')
            setPatients(res.items || [])
        } catch (error) { console.error(error) }
    }

    async function fetchSlots() {
        setLoadingSlots(true)
        setSlots([])
        try {
            const profile = await api.get<any>('/doctors/profile/me')
            const clinicId = profile.clinics?.[0]?.id

            if (clinicId && doctorId) {
                const res = await api.get<any[]>(`/appointments/slots?clinicId=${clinicId}&doctorId=${doctorId}&date=${formData.appointmentDate}`)
                setSlots(res || [])
            }
        } catch (error) {
            console.error('Failed to load slots', error)
        } finally {
            setLoadingSlots(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!doctorId) return
        setSubmitting(true)
        try {
            const profile = await api.get<any>('/doctors/profile/me')
            const clinicId = profile.clinics?.[0]?.id
            if (!clinicId) throw new Error("Clinic ID not found")

            // Find selected slot to get end time, or fallback to 15 mins
            const selectedSlot = slots.find(s => s.start === formData.startTime)
            const endTime = selectedSlot ? selectedSlot.end : addMinutes(formData.startTime, 15)

            const payload: any = {
                clinicId,
                doctorId: doctorId,
                appointmentDate: formData.appointmentDate,
                startTime: formData.startTime,
                endTime: endTime,
                notes: formData.notes
            }

            if (patientMode === 'new') {
                payload.patientData = {
                    name: newPatientName,
                    phone: phoneSearch,
                    email: newPatientEmail || undefined,
                }
            } else {
                payload.patientId = formData.patientId
            }

            await api.post('/appointments', payload)
            onSuccess()
        } catch (error: any) {
            console.error(error)
            const msg = error.response?.data?.message || error.message || 'Failed to book appointment'
            alert(Array.isArray(msg) ? msg.join('\n') : msg)
        } finally {
            setSubmitting(false)
        }
    }

    function resetForm() {
        setFormData({
            patientId: '',
            appointmentDate: new Date().toISOString().split('T')[0],
            startTime: '',
            notes: ''
        })
        setSlots([])
        setPatientMode('search')
        setPhoneSearch('')
        setFoundPatient(null)
        setNewPatientName('')
        setNewPatientEmail('')
        setPatientSearch('')
    }

    function addMinutes(time: string, mins: number) {
        if (!time) return ''
        const [h, m] = time.split(':').map(Number)
        const date = new Date()
        date.setHours(h, m + mins)
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }

    function getPatientDisplayName(p: any) {
        if (!p) return 'Unknown'
        if (p.firstName && p.lastName) return `${p.firstName} ${p.lastName}`
        return p.name || 'Unknown'
    }

    const isSubmitDisabled = () => {
        if (submitting) return true
        if (!formData.appointmentDate || !formData.startTime) return true
        if (patientMode === 'new') {
            if (!newPatientName.trim() || !phoneSearch.trim()) return true
        } else if (patientMode === 'existing') {
            if (!formData.patientId) return true
        } else {
            return true
        }
        return false
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200 my-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Book Appointment</h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Patient Selection Section */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Patient</label>
                        {patientMode === 'existing' && foundPatient ? (
                            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-semibold">
                                        {getPatientDisplayName(foundPatient).charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{getPatientDisplayName(foundPatient)}</p>
                                        <p className="text-xs text-gray-500">{foundPatient.phone}{foundPatient.email ? ` · ${foundPatient.email}` : ''}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPatientMode('search')
                                        setPhoneSearch('')
                                        setFoundPatient(null)
                                        setFormData(prev => ({ ...prev, patientId: '' }))
                                    }}
                                    className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                >
                                    Change
                                </button>
                            </div>
                        ) : patientMode === 'new' ? (
                            <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-blue-700">
                                        <UserPlus className="w-4 h-4" />
                                        <span className="text-sm font-medium">Quick Register New Patient</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPatientMode('search')
                                            setNewPatientName('')
                                            setNewPatientEmail('')
                                        }}
                                        className="text-xs text-gray-500 hover:text-red-600"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                <div className="text-xs text-gray-500 bg-white/60 rounded px-2 py-1.5">
                                    Phone: <span className="font-mono font-medium text-gray-700">{phoneSearch}</span>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={newPatientName}
                                        onChange={e => setNewPatientName(e.target.value)}
                                        placeholder="Patient full name"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Email <span className="text-gray-400">(optional)</span></label>
                                    <input
                                        type="email"
                                        className="input w-full"
                                        value={newPatientEmail}
                                        onChange={e => setNewPatientEmail(e.target.value)}
                                        placeholder="patient@example.com"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by phone number (e.g. +919876...)"
                                        className="input w-full pl-9 pr-10"
                                        value={phoneSearch}
                                        onChange={e => setPhoneSearch(e.target.value)}
                                    />
                                    {phoneSearchLoading && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin" />
                                    )}
                                </div>
                                {phoneSearch.length >= 4 && !phoneSearchLoading && !foundPatient && (
                                    <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="text-sm text-amber-800">No patient found with this number</p>
                                        <button
                                            type="button"
                                            onClick={() => setPatientMode('new')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" />
                                            Quick Register
                                        </button>
                                    </div>
                                )}
                                <details className="group">
                                    <summary className="text-xs text-primary-600 cursor-pointer hover:text-primary-700 select-none">
                                        Or select from existing patients
                                    </summary>
                                    <div className="mt-2 space-y-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Filter by name, phone or email..."
                                                className="input w-full pl-9"
                                                value={patientSearch}
                                                onChange={e => setPatientSearch(e.target.value)}
                                            />
                                        </div>
                                        {(() => {
                                            const filtered = patients.filter(p => {
                                                if (!patientSearch) return true
                                                const search = patientSearch.toLowerCase()
                                                const fullName = (p.firstName && p.lastName) ? `${p.firstName} ${p.lastName}` : (p.name || '')
                                                return fullName.toLowerCase().includes(search)
                                                    || (p.phone || '').includes(patientSearch)
                                                    || (p.email || '').toLowerCase().includes(search)
                                            })
                                            return (
                                                <>
                                                    {patientSearch && (
                                                        <p className="text-xs text-gray-500">{filtered.length} patient{filtered.length !== 1 ? 's' : ''} found</p>
                                                    )}
                                                    <select
                                                        className="input w-full"
                                                        value={formData.patientId}
                                                        onChange={e => {
                                                            const pid = e.target.value
                                                            setFormData(prev => ({ ...prev, patientId: pid }))
                                                            if (pid) {
                                                                const p = patients.find(p => p.id === pid)
                                                                setFoundPatient(p)
                                                                setPatientMode('existing')
                                                            }
                                                        }}
                                                        size={Math.min(Math.max(filtered.length + 1, 2), 6)}
                                                    >
                                                        <option value="">Select Patient</option>
                                                        {filtered.map(p => (
                                                            <option key={p.id} value={p.id}>
                                                                {(p.firstName && p.lastName) ? `${p.firstName} ${p.lastName}` : p.name} ({p.phone})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </>
                                            )
                                        })()}
                                    </div>
                                </details>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input
                            type="date"
                            className="input w-full"
                            value={formData.appointmentDate}
                            onChange={e => setFormData({ ...formData, appointmentDate: e.target.value, startTime: '' })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Available Slots</label>
                        {loadingSlots ? (
                            <div className="text-sm text-gray-500">Loading slots...</div>
                        ) : slots.length === 0 ? (
                            <div className="text-sm text-red-500">No slots available for this date</div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                                {slots.map(slot => (
                                    <button
                                        key={slot.start}
                                        type="button"
                                        disabled={!slot.available}
                                        onClick={() => setFormData({ ...formData, startTime: slot.start })}
                                        className={`px-2 py-1.5 text-sm rounded-lg border transition-colors ${formData.startTime === slot.start
                                            ? 'bg-primary-600 text-white border-primary-600'
                                            : slot.available
                                                ? 'bg-white text-gray-700 border-gray-200 hover:border-primary-500'
                                                : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                            }`}
                                    >
                                        {slot.start}
                                    </button>
                                ))}
                            </div>
                        )}
                        <input type="hidden" required value={formData.startTime} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <textarea
                            className="input w-full"
                            rows={3}
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                        <button
                            type="submit"
                            disabled={isSubmitDisabled()}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                            {submitting ? 'Booking...' : 'Book Appointment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        PENDING: 'bg-yellow-100 text-yellow-800',
        CONFIRMED: 'bg-blue-100 text-blue-800',
        COMPLETED: 'bg-green-100 text-green-800',
        CANCELLED: 'bg-red-100 text-red-800',
    }
    const label = status.charAt(0) + status.slice(1).toLowerCase()
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
            {label}
        </span>
    )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">{icon}</div>
            <div><p className="text-sm text-gray-500">{label}</p><p className="text-xl font-bold">{value}</p></div>
        </div>
    )
}


