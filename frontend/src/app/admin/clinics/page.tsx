'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, MapPin, Phone, Building2, MoreVertical, Trash2, Edit, Download, ToggleLeft, ToggleRight } from 'lucide-react'

interface Clinic {
    id: string
    name: string
    address: string
    phone: string
    email: string
    isActive: boolean
    createdAt: string
    _count?: {
        doctors: number
        patients: number
    }
}

export default function ClinicsPage() {
    const [clinics, setClinics] = useState<Clinic[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchClinics()
    }, [])

    async function fetchClinics() {
        try {
            const token = localStorage.getItem('accessToken')
            const res = await fetch('/api/v1/clinics', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            setClinics(data.items || [])
        } catch (error) {
            console.error('Failed to fetch clinics:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('WARNING: Hard Deletion is irreversible. Have you exported the clinic data first? Are you sure you want to completely wipe this clinic and all related users, appointments, and data?')) return

        try {
            const token = localStorage.getItem('accessToken')
            const res = await fetch(`/api/v1/clinics/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })

            if (!res.ok) throw new Error('Failed to delete clinic')

            setClinics(clinics.filter(c => c.id !== id))
        } catch (error) {
            console.error('Failed to delete clinic:', error)
            alert('Failed to delete clinic')
        }
    }

    async function handleExport(id: string, name: string) {
        try {
            const token = localStorage.getItem('accessToken')
            const res = await fetch(`/api/v1/clinics/${id}/export`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Failed to export data')
            const data = await res.json()

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `clinic-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-export.json`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Failed to export clinic data:', error)
            alert('Failed to export data. Please try again later.')
        }
    }

    async function toggleStatus(id: string, currentActive: boolean) {
        if (!confirm(`Are you sure you want to ${currentActive ? 'suspend' : 'activate'} this clinic?`)) return
        try {
            const token = localStorage.getItem('accessToken')
            const res = await fetch(`/api/v1/clinics/${id}/status?isActive=${!currentActive}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Failed to update status')
            fetchClinics()
        } catch (error) {
            console.error('Failed to update clinic status:', error)
            alert('Failed to update clinic status')
        }
    }

    const filteredClinics = clinics.filter(clinic =>
        clinic.name.toLowerCase().includes(search.toLowerCase()) ||
        clinic.address.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Clinics</h1>
                    <p className="text-gray-500">Manage all registered clinics</p>
                </div>
                <Link
                    href="/admin/clinics/new"
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add New Clinic</span>
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search clinics by name or address..."
                    className="input pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-10">Loading clinics...</div>
            ) : filteredClinics.length === 0 ? (
                <div className="text-center py-10 card">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No clinics found</h3>
                    <p className="text-gray-500">Get started by adding a new clinic.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredClinics.map((clinic) => (
                        <div key={clinic.id} className="card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <Building2 className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900">{clinic.name}</h3>
                                    <div className="flex items-center text-gray-500 text-sm mt-1 space-x-4">
                                        <span className="flex items-center">
                                            <MapPin className="w-4 h-4 mr-1" />
                                            {clinic.address}
                                        </span>
                                        <span className="flex items-center">
                                            <Phone className="w-4 h-4 mr-1" />
                                            {clinic.phone}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 self-end md:self-center">
                                <div className="text-right mr-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${clinic.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {clinic.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleExport(clinic.id, clinic.name)}
                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Export Clinic Data"
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => toggleStatus(clinic.id, clinic.isActive)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title={clinic.isActive ? "Suspend Clinic" : "Activate Clinic"}
                                    >
                                        {clinic.isActive ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Clinic">
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(clinic.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Hard Delete Clinic"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
