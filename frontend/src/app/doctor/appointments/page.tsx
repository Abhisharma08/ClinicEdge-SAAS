'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Calendar, Plus, Check, X, Clock, Edit2, Stethoscope, ClipboardCheck, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'

export default function DoctorAppointmentsPage() {
    const router = useRouter()
    const [appointments, setAppointments] = useState<any[]>([])
    const [patients, setPatients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)
    const [statusFilter, setStatusFilter] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [slots, setSlots] = useState<any[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)
    const [patientSearch, setPatientSearch] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        patientId: '',
        appointmentDate: '',
        startTime: '',
        endTime: '',
        notes: ''
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    useEffect(() => {
        if (profile?.id) {
            fetchAppointments()
        }
    }, [statusFilter, profile])

    useEffect(() => {
        if (isModalOpen && profile && formData.appointmentDate) {
            fetchSlots()
        }
    }, [isModalOpen, profile, formData.appointmentDate])

    async function fetchProfile() {
        try {
            const p = await api.get<any>('/doctors/profile/me')
            setProfile(p)
            fetchPatients()
        } catch (error) {
            console.error('Failed to load profile', error)
        }
    }

    async function fetchAppointments() {
        if (!profile?.id) return
        setLoading(true)
        try {
            const query = statusFilter ? `?status=${statusFilter}&limit=50` : '?limit=50'
            const res = await api.get<any>(`/doctors/${profile.id}/appointments${query}`)
            setAppointments(res.items || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchPatients() {
        try {
            const res = await api.get<any>('/patients?limit=200')
            setPatients(res.items || [])
        } catch (error) { console.error(error) }
    }

    async function fetchSlots() {
        if (!profile?.clinics?.[0]?.id || !profile?.id) return
        setLoadingSlots(true)
        setSlots([])
        try {
            const clinicId = profile.clinics[0].id
            const res = await api.get<any[]>(`/appointments/slots?clinicId=${clinicId}&doctorId=${profile.id}&date=${formData.appointmentDate}`)
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
            fetchAppointments()
        } catch (error) {
            console.error(error)
            alert('Failed to update status')
        }
    }

    async function handleCancel(id: string) {
        if (!confirm('Are you sure you want to cancel this appointment?')) return
        try {
            await api.delete(`/appointments/${id}`)
            fetchAppointments()
        } catch (error) {
            console.error(error)
            alert('Failed to cancel appointment')
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!profile?.clinics?.[0]?.id) return
        setSubmitting(true)

        try {
            const clinicId = profile.clinics[0].id
            const selectedSlot = slots.find(s => s.start === formData.startTime)
            const endTime = formData.endTime || (selectedSlot ? selectedSlot.end : addMinutes(formData.startTime, 30))

            const payload = {
                clinicId,
                patientId: formData.patientId,
                doctorId: profile.id,
                appointmentDate: formData.appointmentDate,
                startTime: formData.startTime,
                endTime,
                notes: formData.notes
            }

            if (editingId) {
                await api.put(`/appointments/${editingId}`, payload)
            } else {
                await api.post('/appointments', payload)
            }

            setIsModalOpen(false)
            resetForm()
            fetchAppointments()
        } catch (error: any) {
            console.error(error)
            const msg = error.response?.data?.message || error.message || 'Failed to save appointment'
            alert(Array.isArray(msg) ? msg.join('\n') : msg)
        } finally {
            setSubmitting(false)
        }
    }

    function resetForm() {
        setFormData({ patientId: '', appointmentDate: '', startTime: '', endTime: '', notes: '' })
        setEditingId(null)
        setSlots([])
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
            appointmentDate: new Date(apt.appointmentDate).toISOString().split('T')[0],
            startTime: getIsoTime(apt.startTime),
            endTime: apt.endTime ? getIsoTime(apt.endTime) : '',
            notes: apt.notes || ''
        })
        setIsModalOpen(true)
    }

    function openNewModal() {
        resetForm()
        setIsModalOpen(true)
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
            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        } catch (e) { return '' }
    }

    const filteredPatients = patientSearch
        ? patients.filter(p => {
            const name = (p.firstName && p.lastName) ? `${p.firstName} ${p.lastName}` : (p.name || '')
            return name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                (p.phone || '').includes(patientSearch)
        })
        : patients

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
                <button
                    onClick={openNewModal}
                    className="btn-primary flex items-center"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Appointment
                </button>
            </div>

            <div className="card">
                <div className="flex p-4 border-b space-x-2 overflow-x-auto">
                    <button
                        onClick={() => setStatusFilter('')}
                        className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${!statusFilter ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        All
                    </button>
                    {['PENDING', 'CONFIRMED', 'COMPLETED', 'COMPLETED_OFFLINE', 'CANCELLED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${statusFilter === status ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
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
                                <th className="px-6 py-3 font-medium">Date & Time</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Notes</th>
                                <th className="px-6 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                    <div className="flex items-center justify-center gap-2">
                                        <Clock className="w-5 h-5 animate-spin" /> Loading...
                                    </div>
                                </td></tr>
                            ) : appointments.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                    No appointments found
                                </td></tr>
                            ) : (
                                appointments.map((apt) => (
                                    <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">
                                                {apt.patient?.firstName && apt.patient?.lastName
                                                    ? `${apt.patient.firstName} ${apt.patient.lastName}`
                                                    : apt.patient?.name || 'Unknown'}
                                            </div>
                                            <div className="text-xs text-gray-400">{apt.patient?.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div>{new Date(apt.appointmentDate).toLocaleDateString()}</div>
                                            <div className="text-xs text-gray-400">{formatDisplayTime(apt.startTime)}</div>
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
                                        <td className="px-6 py-4 text-gray-500 text-sm max-w-[200px] truncate">
                                            {apt.notes || '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-1">
                                                {apt.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleStatusChange(apt.id, 'CONFIRMED')}
                                                        className="p-1.5 hover:bg-green-100 text-green-600 rounded-lg"
                                                        title="Confirm"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && apt.status !== 'COMPLETED_OFFLINE' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(apt)}
                                                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                                                            title="Edit / Reschedule"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(apt.id)}
                                                            className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg"
                                                            title="Cancel"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {apt.status === 'CONFIRMED' && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                const isFuture = new Date(apt.appointmentDate) > new Date(new Date().setHours(23, 59, 59, 999))
                                                                // Actually simpler: check if date part is > today
                                                                const today = new Date(); today.setHours(0, 0, 0, 0)
                                                                const aptDate = new Date(apt.appointmentDate); aptDate.setHours(0, 0, 0, 0)
                                                                if (aptDate > today) return
                                                                router.push(`/doctor/consultations/${apt.id}`)
                                                            }}
                                                            disabled={new Date(new Date(apt.appointmentDate).setHours(0, 0, 0, 0)) > new Date(new Date().setHours(0, 0, 0, 0))}
                                                            className={`p-1.5 rounded-lg ${new Date(new Date(apt.appointmentDate).setHours(0, 0, 0, 0)) > new Date(new Date().setHours(0, 0, 0, 0))
                                                                ? 'text-gray-300 cursor-not-allowed'
                                                                : 'hover:bg-blue-100 text-blue-600'}`}
                                                            title={new Date(new Date(apt.appointmentDate).setHours(0, 0, 0, 0)) > new Date(new Date().setHours(0, 0, 0, 0))
                                                                ? "Cannot start future consultation"
                                                                : "Start Consultation"}
                                                        >
                                                            <Stethoscope className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm('Mark as completed with written prescription?')) return
                                                                try {
                                                                    await api.patch(`/appointments/${apt.id}/complete-offline`, {})
                                                                    fetchAppointments()
                                                                } catch { alert('Failed to update') }
                                                            }}
                                                            className="p-1.5 hover:bg-orange-100 text-orange-600 rounded-lg"
                                                            title="Complete (Written Rx)"
                                                        >
                                                            <ClipboardCheck className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Booking / Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm() }}
                title={editingId ? "Reschedule Appointment" : "Book New Appointment"}
                footer={
                    <>
                        <button onClick={() => { setIsModalOpen(false); resetForm() }} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100">Cancel</button>
                        <button onClick={handleSubmit} disabled={submitting || !formData.startTime || !formData.patientId} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
                            {submitting ? 'Saving...' : (editingId ? 'Update' : 'Book')}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    {/* Patient with search */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Patient</label>
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search patients..."
                                className="input w-full pl-9"
                                value={patientSearch}
                                onChange={e => setPatientSearch(e.target.value)}
                            />
                        </div>
                        <select
                            className="input w-full"
                            value={formData.patientId}
                            onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                            required
                        >
                            <option value="">Select Patient</option>
                            {filteredPatients.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.name} ({p.phone})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date */}
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

                    {/* Slot picker */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Available Slots</label>
                        {!formData.appointmentDate ? (
                            <div className="text-sm text-gray-400">Select a date first</div>
                        ) : loadingSlots ? (
                            <div className="text-sm text-gray-500">Loading slots...</div>
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

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <textarea className="input w-full" rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                    </div>
                </div>
            </Modal>
        </div>
    )
}
