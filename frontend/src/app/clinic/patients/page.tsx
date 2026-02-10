'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Users, Plus, Edit2, FileClock, ChevronRight, Search, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

export default function PatientsPage() {
    const router = useRouter()
    const [patients, setPatients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        gender: 'MALE',
        dob: ''
    })
    const [submitting, setSubmitting] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const searchParams = useSearchParams()

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            const parsedUser = JSON.parse(userData)
            setUser(parsedUser)
            if (parsedUser.clinicId) {
                fetchPatients(parsedUser.clinicId)
            }
        }

        // Open modal if action=new
        if (searchParams.get('action') === 'new') {
            openNewModal()
        }
    }, [searchParams])

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (user?.clinicId) fetchPatients(user.clinicId, searchQuery)
        }, 500)
        return () => clearTimeout(timeoutId)
    }, [searchQuery])

    async function fetchPatients(clinicId: string, search?: string) {
        setLoading(true)
        try {
            const query = new URLSearchParams()
            if (search) query.append('search', search)

            // Note: API client handles /api/v1 prefix, endpoint is /patients
            const res = await api.get<any>(`/patients?${query.toString()}`)
            setPatients(res.items)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this patient?')) return
        try {
            await api.delete(`/patients/${id}`)
            if (user?.clinicId) fetchPatients(user.clinicId, searchQuery)
        } catch (error) {
            console.error(error)
            alert('Failed to delete patient')
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        try {
            if (editingId) {
                await api.put(`/patients/${editingId}`, {
                    name: formData.name,
                    phone: formData.phone,
                    gender: formData.gender,
                    dob: formData.dob ? new Date(formData.dob).toISOString() : undefined
                })
            } else {
                await api.post('/patients', {
                    name: formData.name,
                    phone: formData.phone,
                    gender: formData.gender,
                    dob: formData.dob ? new Date(formData.dob).toISOString() : undefined
                })
            }
            setIsModalOpen(false)
            setFormData({ name: '', phone: '', gender: 'MALE', dob: '' })
            setEditingId(null)
            if (user?.clinicId) fetchPatients(user.clinicId)
        } catch (error) {
            console.error(error)
            alert('Failed to save patient')
        } finally {
            setSubmitting(false)
        }
    }

    function handleEdit(patient: any) {
        setEditingId(patient.id)
        setFormData({
            name: patient.name,
            phone: patient.phone,
            gender: patient.gender,
            dob: patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : ''
        })
        setIsModalOpen(true)
    }

    function openNewModal() {
        setEditingId(null)
        setFormData({ name: '', phone: '', gender: 'MALE', dob: '' })
        setIsModalOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
                <div className="flex space-x-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search patients..."
                            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                    <button
                        onClick={openNewModal}
                        className="btn-primary flex items-center"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Register Patient
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-6 py-3 font-medium">Name</th>
                                <th className="px-6 py-3 font-medium">Phone</th>
                                <th className="px-6 py-3 font-medium">Gender</th>
                                <th className="px-6 py-3 font-medium">Last Visit</th>
                                <th className="px-6 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : patients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                        No patients found
                                    </td>
                                </tr>
                            ) : (
                                patients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {patient.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {patient.phone}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {patient.gender}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            -
                                        </td>
                                        <td className="px-6 py-4 flex space-x-2">
                                            <button
                                                onClick={() => router.push(`/clinic/patients/${patient.id}`)}
                                                className="p-1 hover:bg-gray-100 rounded text-gray-500 tooltip"
                                                title="View History"
                                            >
                                                <FileClock className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(patient)}
                                                className="p-1 hover:bg-gray-100 rounded text-gray-500 tooltip"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(patient.id); }}
                                                className="p-1 hover:bg-red-100 rounded text-red-500"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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
                title={editingId ? "Edit Patient" : "Register New Patient"}
                footer={
                    <>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : (editingId ? 'Update Patient' : 'Register Patient')}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            className="input w-full"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="text"
                            className="input w-full"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <select
                                className="input w-full"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            >
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                            <input
                                type="date"
                                className="input w-full"
                                value={formData.dob}
                                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
