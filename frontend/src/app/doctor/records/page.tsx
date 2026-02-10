'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { FileText, Calendar, User, Search } from 'lucide-react'
import Link from 'next/link'

export default function DoctorRecordsPage() {
    const [records, setRecords] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchRecords()
    }, [])

    async function fetchRecords() {
        setLoading(true)
        try {
            // Fetch COMPLETED appointments as "Records"
            // We can also fetch by doctorId if we used the profile endpoint first, 
            // but GET /appointments handles context if we don't pass filtered params? 
            // Actually AppointmentsController.findAll filters by doctorId if passed, 
            // but by default list ALL clinic appointments. 
            // Ideally we want ALL clinic records? Or just "My Records"?
            // Usually "Records" implies accessing the clinic's database.
            const res = await api.get<any>('/appointments?status=COMPLETED&limit=50')
            setRecords(res.items || [])
        } catch (error) {
            console.error('Failed to load records', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredRecords = records.filter(r =>
        r.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.doctor?.name?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
                <p className="text-gray-500">History of completed consultations</p>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by patient or doctor..."
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
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Doctor</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Diagnosis/Notes</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading records...</td></tr>
                        ) : filteredRecords.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No records found</td></tr>
                        ) : (
                            filteredRecords.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                            {new Date(record.startTime).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {new Date(record.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{record.patient?.name || 'Unknown'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600">Dr. {record.doctor?.name || 'Unknown'}</div>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs truncate">
                                        <span className="text-sm text-gray-600">
                                            {record.visitRecord?.diagnosis || record.notes || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/clinic/consultations/${record.id}`}
                                            className="text-primary-600 hover:text-primary-800 font-medium text-sm flex items-center gap-1"
                                        >
                                            <FileText className="w-4 h-4" />
                                            View Details
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
