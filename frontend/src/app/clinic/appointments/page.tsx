'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { api } from '@/lib/api'
import { Calendar, Plus, Filter, Check, X, Clock, Edit2, Stethoscope, FileText, ClipboardCheck, Search, UserPlus, Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'

function AppointmentsPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [appointments, setAppointments] = useState<any[]>([])
    const [doctors, setDoctors] = useState<any[]>([])
    const [patients, setPatients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [statusFilter, setStatusFilter] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [slots, setSlots] = useState<any[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)

    // Patient selection state
    const [patientMode, setPatientMode] = useState<'search' | 'existing' | 'new'>('search')
    const [phoneSearch, setPhoneSearch] = useState('')
    const [phoneSearchLoading, setPhoneSearchLoading] = useState(false)
    const [foundPatient, setFoundPatient] = useState<any>(null)
    const [newPatientName, setNewPatientName] = useState('')
    const [newPatientEmail, setNewPatientEmail] = useState('')
    const [patientSearch, setPatientSearch] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        patientId: '',
        doctorId: '',
        appointmentDate: '',
        startTime: '',
        endTime: '',
        notes: ''
    })

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            const parsedUser = JSON.parse(userData)
            setUser(parsedUser)
            if (parsedUser.clinicId) {
                fetchAppointments(parsedUser.clinicId)
                fetchDoctors(parsedUser.clinicId)
                fetchPatients(parsedUser.clinicId)
            }
        }
    }, [])

    // Handle bookFor query param (from patients page)
    useEffect(() => {
        const bookForId = searchParams.get('bookFor')
        if (bookForId && patients.length > 0) {
            const patient = patients.find((p: any) => p.id === bookForId)
            if (patient) {
                setFormData(prev => ({ ...prev, patientId: bookForId }))
                setPatientMode('existing')
                setFoundPatient(patient)
                setIsModalOpen(true)
                // Clean URL
                router.replace('/clinic/appointments', { scroll: false })
            }
        }
    }, [searchParams, patients])

    useEffect(() => {
        if (user?.clinicId) {
            fetchAppointments(user.clinicId)
        }
    }, [statusFilter])

    useEffect(() => {
        if (isModalOpen && formData.doctorId && formData.appointmentDate && user?.clinicId) {
            fetchSlots(user.clinicId, formData.doctorId, formData.appointmentDate)
        } else {
            setSlots([])
        }
    }, [isModalOpen, formData.doctorId, formData.appointmentDate])

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

    async function fetchAppointments(clinicId: string) {
        setLoading(true)
        try {
            const query = statusFilter ? `?status=${statusFilter}` : ''
            const res = await api.get<any>(`/appointments${query}`)
            setAppointments(res.items)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchDoctors(clinicId: string) {
        try {
            const res = await api.get<any>(`/doctors?clinicId=${clinicId}`)
            setDoctors(res.items)
        } catch (error) { console.error(error) }
    }

    async function fetchPatients(clinicId: string) {
        try {
            const res = await api.get<any>('/patients?limit=200')
            setPatients(res.items)
        } catch (error) { console.error(error) }
    }

    async function fetchSlots(clinicId: string, doctorId: string, date: string) {
        setLoadingSlots(true)
        setSlots([])
        try {
            const res = await api.get<any[]>(`/appointments/slots?clinicId=${clinicId}&doctorId=${doctorId}&date=${date}`)
            setSlots(res || [])
        } catch (error) {
            console.error('Failed to load slots', error)
        } finally {
            setLoadingSlots(false)
        }
    }

    async function handleStatusChange(id: string, newStatus: string) {
        if (!confirm(`Mark appointment as ${newStatus}?`)) return
        try {
            await api.patch(`/appointments/${id}/status?status=${newStatus}`, {})
            if (user?.clinicId) fetchAppointments(user.clinicId)
        } catch (error) {
            console.error(error)
            alert('Failed to update status')
        }
    }

    async function handleCancel(id: string) {
        if (!confirm('Are you sure you want to cancel this appointment?')) return
        try {
            await api.delete(`/appointments/${id}`)
            if (user?.clinicId) fetchAppointments(user.clinicId)
        } catch (error) {
            console.error(error)
            alert('Failed to cancel appointment')
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)

        try {
            const payload: any = {
                clinicId: user.clinicId,
                doctorId: formData.doctorId,
                appointmentDate: formData.appointmentDate,
                startTime: formData.startTime,
                endTime: formData.endTime || addMinutes(formData.startTime, 30),
                notes: formData.notes
            }

            // If creating a new patient inline, send patientData instead of patientId
            if (patientMode === 'new') {
                payload.patientData = {
                    name: newPatientName,
                    phone: phoneSearch,
                    email: newPatientEmail || undefined,
                }
            } else {
                payload.patientId = formData.patientId
            }

            if (editingId) {
                payload.patientId = formData.patientId // Always use patientId for edits
                delete payload.patientData
                await api.put(`/appointments/${editingId}`, payload)
            } else {
                await api.post('/appointments', payload)
            }

            closeModal()
            if (user?.clinicId) {
                fetchAppointments(user.clinicId)
                fetchPatients(user.clinicId) // Refresh patients list in case a new one was created
            }
        } catch (error: any) {
            console.error(error)
            const msg = error.response?.data?.message || error.message || 'Failed to create appointment'
            alert(Array.isArray(msg) ? msg.join('\n') : msg)
        } finally {
            setSubmitting(false)
        }
    }

    function addMinutes(time: string, mins: number) {
        if (!time) return ''
        const [h, m] = time.split(':').map(Number)
        const date = new Date()
        date.setHours(h, m + mins)
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }

    function handleEdit(apt: any) {
        setEditingId(apt.id)
        setFormData({
            patientId: apt.patientId,
            doctorId: apt.doctorId,
            appointmentDate: new Date(apt.appointmentDate).toISOString().split('T')[0],
            startTime: getIsoTime(apt.startTime),
            endTime: apt.endTime ? getIsoTime(apt.endTime) : '',
            notes: apt.notes || ''
        })
        // For edits, show existing patient (no need for phone search)
        setPatientMode('existing')
        setFoundPatient(apt.patient)
        setIsModalOpen(true)
    }

    function openNewModal() {
        setEditingId(null)
        setFormData({ patientId: '', doctorId: '', appointmentDate: '', startTime: '', endTime: '', notes: '' })
        setPatientMode('search')
        setPhoneSearch('')
        setFoundPatient(null)
        setNewPatientName('')
        setNewPatientEmail('')
        setPatientSearch('')
        setIsModalOpen(true)
    }

    function closeModal() {
        setIsModalOpen(false)
        setFormData({ patientId: '', doctorId: '', appointmentDate: '', startTime: '', endTime: '', notes: '' })
        setEditingId(null)
        setPatientMode('search')
        setPhoneSearch('')
        setFoundPatient(null)
        setNewPatientName('')
        setNewPatientEmail('')
        setPatientSearch('')
    }

    function formatDisplayTime(isoString: string) {
        try {
            const date = new Date(isoString)
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } catch (e) { return isoString }
    }

    function getIsoTime(isoString: string) {
        try {
            const date = new Date(isoString)
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            return `${hours}:${minutes}`
        } catch (e) { return '' }
    }

    const getPatientDisplayName = (p: any) => {
        if (!p) return 'Unknown'
        if (p.firstName && p.lastName) return `${p.firstName} ${p.lastName}`
        return p.name || 'Unknown'
    }

    // Check if submit is valid
    const isSubmitDisabled = () => {
        if (submitting) return true
        if (!formData.doctorId || !formData.appointmentDate || !formData.startTime) return true
        if (patientMode === 'new') {
            if (!newPatientName.trim() || !phoneSearch.trim()) return true
        } else if (patientMode === 'existing') {
            if (!formData.patientId) return true
        } else {
            // still in search mode, nothing selected
            return true
        }
        return false
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                <button
                    onClick={openNewModal}
                    className="btn-primary flex items-center"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Appointment
                </button>
            </div>

            <div className="card">
                <div className="flex p-4 border-b space-x-2">
                    <button
                        onClick={() => setStatusFilter('')}
                        className={`px-3 py-1 rounded-full text-sm ${!statusFilter ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        All
                    </button>
                    {['PENDING', 'CONFIRMED', 'COMPLETED', 'COMPLETED_OFFLINE', 'CANCELLED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1 rounded-full text-sm ${statusFilter === status ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            {status === 'COMPLETED_OFFLINE' ? 'Written Rx' : status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-6 py-3 font-medium">Patient</th>
                                <th className="px-6 py-3 font-medium">Doctor</th>
                                <th className="px-6 py-3 font-medium">Date & Time</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-center">Loading...</td></tr>
                            ) : appointments.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-center">No appointments found</td></tr>
                            ) : (
                                appointments.map((apt) => (
                                    <tr key={apt.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {getPatientDisplayName(apt.patient)}
                                            <div className="text-xs text-gray-400">{apt.patient?.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{apt.doctor?.name}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(apt.appointmentDate).toLocaleDateString()} at {formatDisplayTime(apt.startTime)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                                ${apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                                    apt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                        apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                            apt.status === 'COMPLETED_OFFLINE' ? 'bg-orange-100 text-orange-700' :
                                                                apt.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {apt.status === 'COMPLETED_OFFLINE' ? 'Written Rx' : apt.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex space-x-2">
                                            {apt.status === 'PENDING' && (
                                                <button
                                                    onClick={() => handleStatusChange(apt.id, 'CONFIRMED')}
                                                    className="p-1 hover:bg-green-100 text-green-600 rounded tooltip"
                                                    title="Confirm"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                            {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && apt.status !== 'COMPLETED_OFFLINE' && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(apt)}
                                                        className="p-1 hover:bg-gray-100 rounded text-gray-500 tooltip"
                                                        title="Edit / Reschedule"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancel(apt.id)}
                                                        className="p-1 hover:bg-red-100 text-red-600 rounded tooltip"
                                                        title="Cancel"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {apt.status === 'CONFIRMED' && (
                                                <>
                                                    <button
                                                        onClick={() => router.push(`/clinic/consultations/${apt.id}`)}
                                                        className="p-1 hover:bg-blue-100 text-blue-600 rounded tooltip"
                                                        title="Start Consultation"
                                                    >
                                                        <Stethoscope className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Mark as completed with written prescription?')) return
                                                            try {
                                                                await api.patch(`/appointments/${apt.id}/complete-offline`, {})
                                                                if (user?.clinicId) fetchAppointments(user.clinicId)
                                                            } catch { alert('Failed to update') }
                                                        }}
                                                        className="p-1 hover:bg-orange-100 text-orange-600 rounded tooltip"
                                                        title="Complete (Written Rx)"
                                                    >
                                                        <ClipboardCheck className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingId ? "Reschedule Appointment" : "Book New Appointment"}
                footer={
                    <>
                        <button onClick={closeModal} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100">Cancel</button>
                        <button onClick={handleSubmit} disabled={isSubmitDisabled()} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
                            {submitting ? 'Saving...' : (editingId ? 'Update' : 'Book')}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    {/* Patient Selection Section */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Patient</label>

                        {/* Show selected patient if in existing/edit mode */}
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
                                {!editingId && (
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
                                )}
                            </div>
                        ) : patientMode === 'new' ? (
                            /* Quick Create New Patient Form */
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
                            /* Phone Search Mode */
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

                                {/* Show "not found" + quick create option when search yields nothing */}
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

                                {/* Also allow selecting from existing patient list */}
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

                    {/* Doctor & Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Doctor</label>
                            <select
                                className="input w-full"
                                value={formData.doctorId}
                                onChange={e => setFormData({ ...formData, doctorId: e.target.value })}
                                required
                            >
                                <option value="">Select Doctor</option>
                                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Date</label>
                            <input type="date" className="input w-full" value={formData.appointmentDate} onChange={e => setFormData({ ...formData, appointmentDate: e.target.value })} required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Available Slots</label>
                        {!formData.doctorId || !formData.appointmentDate ? (
                            <div className="text-sm text-gray-400">Select a doctor and date first</div>
                        ) : loadingSlots ? (
                            <div className="text-sm text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4 animate-spin" /> Loading slots...</div>
                        ) : slots.length === 0 ? (
                            <div className="text-sm text-red-500">No slots available for this date</div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                                {slots.map(slot => (
                                    <button
                                        key={slot.start}
                                        type="button"
                                        disabled={!slot.available}
                                        onClick={() => setFormData({ ...formData, startTime: slot.start, endTime: slot.end })}
                                        className={`px-2 py-1.5 text-sm rounded-lg border transition-colors ${formData.startTime === slot.start
                                            ? 'bg-primary-600 text-white border-primary-600'
                                            : slot.available
                                                ? 'bg-white text-gray-700 border-gray-200 hover:border-primary-400'
                                                : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                            }`}
                                    >
                                        {slot.start}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <textarea className="input w-full" rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default function AppointmentsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
            <AppointmentsPageContent />
        </Suspense>
    )
}
