'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Award, Plus, MoreVertical, Trash2, Edit2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

export default function SpecialistsPage() {
    const [specialists, setSpecialists] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            const parsedUser = JSON.parse(userData)
            setUser(parsedUser)
            if (parsedUser.clinicId) {
                fetchSpecialists(parsedUser.clinicId)
            }
        }
    }, [])

    async function fetchSpecialists(clinicId: string) {
        setLoading(true)
        try {
            const res = await api.get<any[]>(`/specialists?clinicId=${clinicId}`)
            setSpecialists(res || [])
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
            if (editingId) {
                await api.put(`/specialists/${editingId}`, formData)
            } else {
                await api.post('/specialists', formData)
            }
            setIsModalOpen(false)
            setFormData({ name: '', description: '' })
            setEditingId(null)
            if (user?.clinicId) fetchSpecialists(user.clinicId)
        } catch (error: any) {
            console.error(error)
            const msg = error.response?.data?.message || error.message || 'Failed to save specialist'
            alert(Array.isArray(msg) ? msg.join('\n') : msg)
        } finally {
            setSubmitting(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this specialist? This action cannot be undone.')) return
        try {
            await api.delete(`/specialists/${id}`)
            setSpecialists(specialists.filter(s => s.id !== id))
        } catch (error) {
            console.error(error)
            alert('Failed to delete specialist')
        }
    }

    function openEdit(specialist: any) {
        setEditingId(specialist.id)
        setFormData({
            name: specialist.name,
            description: specialist.description || '',
        })
        setIsModalOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Specialists
                    </h1>
                    <p className="text-gray-500 mt-1">Manage medical specialties offered at your clinic</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null)
                        setFormData({ name: '', description: '' })
                        setIsModalOpen(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                    <Plus size={20} />
                    <span>Add Specialist</span>
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : specialists.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Award className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No specialists found</h3>
                    <p className="text-gray-500">Add your first specialist to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {specialists.map((specialist) => (
                        <div
                            key={specialist.id}
                            className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all relative"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                    <Award size={24} />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEdit(specialist)}
                                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(specialist.id)}
                                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{specialist.name}</h3>
                            {specialist.description && (
                                <p className="text-sm text-gray-500 line-clamp-2">{specialist.description}</p>
                            )}
                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                                <span>{specialist.doctors?.length || 0} Doctors</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Edit Specialist' : 'Add New Specialist'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Speciality Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded-lg border-gray-300 focus:ring-black focus:border-black transition-colors"
                            placeholder="e.g., Cardiology, Pediatrics"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full rounded-lg border-gray-300 focus:ring-black focus:border-black transition-colors"
                            rows={3}
                            placeholder="Optional description..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : editingId ? 'Update Specialist' : 'Add Specialist'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
