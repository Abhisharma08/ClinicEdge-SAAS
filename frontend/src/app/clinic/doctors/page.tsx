'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { UserCog, Plus, MoreVertical, Trash2, Edit2, Search } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        qualification: '',
        licenseNumber: '',
        phone: '',
    })
    const [submitting, setSubmitting] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            const parsedUser = JSON.parse(userData)
            setUser(parsedUser)
            if (parsedUser.clinicId) {
                fetchDoctors(parsedUser.clinicId)
            }
        }
    }, [])

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (user?.clinicId) fetchDoctors(user.clinicId, searchQuery)
        }, 500)
        return () => clearTimeout(timeoutId)
    }, [searchQuery])

    async function fetchDoctors(clinicId: string, search?: string) {
        setLoading(true)
        try {
            const query = new URLSearchParams()
            query.append('clinicId', clinicId)
            if (search) query.append('search', search)

            const res = await api.get<any>(`/doctors?${query.toString()}`)
            setDoctors(res.items)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this doctor? This action cannot be undone.')) return
        try {
            await api.delete(`/doctors/${id}`)
            if (user?.clinicId) fetchDoctors(user.clinicId, searchQuery)
        } catch (error) {
            console.error(error)
            alert('Failed to delete doctor')
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        try {
            if (editingId) {
                // Remove password from payload for update
                const { password, ...updateData } = formData
                await api.put(`/doctors/${editingId}`, updateData)
            } else {
                await api.post('/doctors', formData)
            }
            setIsModalOpen(false)
            setFormData({
                name: '', email: '', password: '', qualification: '', licenseNumber: '', phone: ''
            })
            setEditingId(null)
            if (user?.clinicId) fetchDoctors(user.clinicId)
        } catch (error) {
            console.error(error)
            alert('Failed to add doctor')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
                <div className="flex space-x-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search doctors..."
                            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null)
                            setFormData({
                                name: '', email: '', password: '', qualification: '', licenseNumber: '', phone: ''
                            })
                            setIsModalOpen(true)
                        }}
                        className="btn-primary flex items-center"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Doctor
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-6 py-3 font-medium">Name</th>
                                <th className="px-6 py-3 font-medium">Specialization</th>
                                <th className="px-6 py-3 font-medium">License</th>
                                <th className="px-6 py-3 font-medium">Qualification</th>
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
                            ) : doctors.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                        No doctors found
                                    </td>
                                </tr>
                            ) : (
                                doctors.map((doctor) => (
                                    <tr key={doctor.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            Dr. {doctor.name}
                                            <div className="text-xs text-gray-400">{doctor.user?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {doctor.specialist?.name || 'General'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {doctor.licenseNumber || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {doctor.qualification}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => {
                                                    setEditingId(doctor.id)
                                                    setFormData({
                                                        name: doctor.name,
                                                        email: doctor.user?.email || '',
                                                        password: '',
                                                        qualification: doctor.qualification || '',
                                                        licenseNumber: doctor.licenseNumber || '',
                                                        phone: doctor.phone || ''
                                                    })
                                                    setIsModalOpen(true)
                                                }}
                                                className="p-1 hover:bg-gray-100 rounded text-gray-500"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(doctor.id)}
                                                className="p-1 hover:bg-red-50 rounded text-red-500 ml-1"
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
                title={editingId ? "Edit Doctor" : "Add New Doctor"}
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
                            {submitting ? 'Saving...' : (editingId ? 'Update Doctor' : 'Create Doctor')}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            className="input w-full"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="input w-full"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    {!editingId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                className="input w-full"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="text"
                                className="input w-full"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">License No.</label>
                            <input
                                type="text"
                                className="input w-full"
                                value={formData.licenseNumber}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                            <input
                                type="text"
                                className="input w-full"
                                value={formData.qualification}
                                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                                required
                            />
                        </div>
                        {/* Experience removed from backend for now, kept in UI state but maybe ignored? 
                            Values are sent as experience: Number(...).
                            Wait, I replaced 'experience' with 'licenseNumber' in DTO.
                            So 'experience' is not in DTO. Passing it is extra field, might be stripped.
                            But 'licenseNumber' is required.
                            I added licenseNumber to form.
                         */}
                    </div>
                </div>
            </Modal>
        </div>
    )
}
