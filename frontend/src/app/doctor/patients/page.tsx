'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Search, MapPin, Phone, User, FileText, Plus, X } from 'lucide-react'
import Link from 'next/link'

export default function DoctorPatientsPage() {
    const [patients, setPatients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [isAddPatientOpen, setIsAddPatientOpen] = useState(false)

    useEffect(() => {
        fetchPatients()
    }, [search]) // Re-fetch when search changes (debounce ideally)

    async function fetchPatients() {
        setLoading(true)
        try {
            const params = search ? `?search=${search}` : ''
            const res = await api.get<any>(`/patients${params}`)
            setPatients(res.items || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Patients</h1>
                    <p className="text-gray-500">View patient records and history</p>
                </div>
                <button
                    onClick={() => setIsAddPatientOpen(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Patient
                </button>
            </div>

            <AddPatientModal
                isOpen={isAddPatientOpen}
                onClose={() => setIsAddPatientOpen(false)}
                onSuccess={(newPatient) => {
                    setPatients([newPatient, ...patients])
                    setIsAddPatientOpen(false)
                }}
            />

            <div className="flex gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search patients..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-black focus:border-black"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Age/Gender</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading patients...</td></tr>
                        ) : patients.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">No patients found</td></tr>
                        ) : (
                            patients.map((patient) => (
                                <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium">
                                                {patient.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{patient.name}</p>
                                                <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                                    <MapPin className="w-3 h-3 mr-1" />
                                                    {patient.address || 'No address'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                            {patient.phone}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600">
                                            {patient.age ? `${patient.age} yrs` : '-'} / {patient.gender?.charAt(0)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/doctor/patients/${patient.id}`}
                                            className="text-primary-600 hover:text-primary-800 font-medium text-sm flex items-center gap-1"
                                        >
                                            <FileText className="w-4 h-4" />
                                            View History
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function AddPatientModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: (patient: any) => void }) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        gender: 'MALE',
        age: '',
        email: '',
        address: '',
        bloodGroup: '',
        allergies: '',
        medicalHistory: ''
    })
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        try {
            // Calculate approximate DOB from age
            const birthYear = new Date().getFullYear() - Number(formData.age)
            const dob = `${birthYear}-01-01`

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { age, ...patientData } = formData

            const res = await api.post<any>('/patients', {
                ...patientData,
                dob,
            })
            alert('Patient added successfully')
            onSuccess(res)
        } catch (error: any) {
            console.error(error)
            alert(error.message || 'Failed to add patient')
        } finally {
            setSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Add New Patient</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name *</label>
                            <input
                                className="input w-full"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone *</label>
                            <input
                                className="input w-full"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Age *</label>
                            <input
                                type="number"
                                className="input w-full"
                                value={formData.age}
                                onChange={e => setFormData({ ...formData, age: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Gender</label>
                            <select
                                className="input w-full"
                                value={formData.gender}
                                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                            >
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Blood Group</label>
                            <select
                                className="input w-full"
                                value={(formData as any).bloodGroup || ''}
                                onChange={e => setFormData({ ...formData, bloodGroup: e.target.value } as any)}
                            >
                                <option value="">Select</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            className="input w-full"
                            value={(formData as any).email || ''}
                            onChange={e => setFormData({ ...formData, email: e.target.value } as any)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <textarea
                            className="input w-full"
                            rows={2}
                            value={(formData as any).address || ''}
                            onChange={e => setFormData({ ...formData, address: e.target.value } as any)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Allergies</label>
                        <input
                            className="input w-full"
                            placeholder="e.g. Peanuts, Penicillin"
                            value={(formData as any).allergies || ''}
                            onChange={e => setFormData({ ...formData, allergies: e.target.value } as any)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Medical History</label>
                        <textarea
                            className="input w-full"
                            rows={2}
                            placeholder="e.g. Diabetes, Hypertension"
                            value={(formData as any).medicalHistory || ''}
                            onChange={e => setFormData({ ...formData, medicalHistory: e.target.value } as any)}
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary w-full"
                        >
                            {submitting ? 'Adding...' : 'Add Patient'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
