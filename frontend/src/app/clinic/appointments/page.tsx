'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Calendar, Plus, Filter, Check, X, Clock, Edit2, Stethoscope, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'

export default function AppointmentsPage() {
    const router = useRouter()
    const [appointments, setAppointments] = useState<any[]>([])
    const [doctors, setDoctors] = useState<any[]>([])
    const [patients, setPatients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [statusFilter, setStatusFilter] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        patientId: '',
        doctorId: '',
        appointmentDate: '',
        startTime: '',
        endTime: '', // Will auto-calculate usually, but manual for now
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

    useEffect(() => {
        if (user?.clinicId) {
            fetchAppointments(user.clinicId)
        }
    }, [statusFilter])

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
            // Note: /patients endpoint uses clinicId from JWT token
            const res = await api.get<any>('/patients')
            setPatients(res.items)
        } catch (error) { console.error(error) }
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
            const payload = {
                clinicId: user.clinicId,
                patientId: formData.patientId,
                doctorId: formData.doctorId,
                appointmentDate: formData.appointmentDate,
                startTime: formData.startTime, // HH:mm
                endTime: formData.endTime || addMinutes(formData.startTime, 30),
                notes: formData.notes
            }

            if (editingId) {
                // Ensure correct DTO shape for partial update if needed, but PUT usually takes full or partial.
                // Payload has all fields.
                await api.put(`/appointments/${editingId}`, payload)
            } else {
                await api.post('/appointments', payload)
            }

            setIsModalOpen(false)
            setFormData({ patientId: '', doctorId: '', appointmentDate: '', startTime: '', endTime: '', notes: '' })
            setEditingId(null)
            if (user?.clinicId) fetchAppointments(user.clinicId)
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
        setIsModalOpen(true)
    }

    function openNewModal() {
        setEditingId(null)
        setFormData({ patientId: '', doctorId: '', appointmentDate: '', startTime: '', endTime: '', notes: '' })
        setIsModalOpen(true)
    }

    // Displays "10:30 AM"
    function formatDisplayTime(isoString: string) {
        try {
            const date = new Date(isoString)
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } catch (e) { return isoString }
    }

    // Extracts "10:30" for input[type="time"]
    function getIsoTime(isoString: string) {
        try {
            const date = new Date(isoString)
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            return `${hours}:${minutes}`
        } catch (e) { return '' }
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
                    {['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1 rounded-full text-sm ${statusFilter === status ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            {status.charAt(0) + status.slice(1).toLowerCase()}
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
                                            {apt.patient?.name || 'Unknown'}
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
                                                        apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {apt.status}
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
                                            {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
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
                                                <button
                                                    onClick={() => router.push(`/clinic/consultations/${apt.id}`)}
                                                    className="p-1 hover:bg-blue-100 text-blue-600 rounded tooltip"
                                                    title="Start Consultation"
                                                >
                                                    <Stethoscope className="w-4 h-4" />
                                                </button>
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
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Reschedule Appointment" : "Book New Appointment"}
                footer={
                    <>
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100">Cancel</button>
                        <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
                            {submitting ? 'Saving...' : (editingId ? 'Update' : 'Book')}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Patient</label>
                            <select
                                className="input w-full"
                                value={formData.patientId}
                                onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                                required
                            >
                                <option value="">Select Patient</option>
                                {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>)}
                            </select>
                        </div>
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
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input type="date" className="input w-full" value={formData.appointmentDate} onChange={e => setFormData({ ...formData, appointmentDate: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Start Time</label>
                            <input type="time" className="input w-full" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">End Time</label>
                            <input type="time" className="input w-full" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                        </div>
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
