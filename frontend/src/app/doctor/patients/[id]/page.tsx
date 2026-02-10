'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { ArrowLeft, Calendar, User, Phone, FileText } from 'lucide-react'

export default function DoctorPatientHistoryPage() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id as string

    const [patient, setPatient] = useState<any>(null)
    const [visits, setVisits] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) {
            fetchData()
        }
    }, [id])

    async function fetchData() {
        setLoading(true)
        try {
            const [patientRes, visitsRes] = await Promise.all([
                api.get<any>(`/patients/${id}`),
                api.get<any>(`/patients/${id}/visits`)
            ])
            setPatient(patientRes)
            setVisits(visitsRes.items || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading patient details...</div>
    if (!patient) return <div className="p-8 text-center text-red-500">Patient not found</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Patient History</h1>
            </div>

            {/* Patient Header Card */}
            <div className="card p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                            {patient.name}
                            <span className="ml-3 text-sm font-normal px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                                {patient.gender}
                            </span>
                        </h2>
                        <div className="mt-2 text-gray-600 flex items-center space-x-4 text-sm">
                            <span className="flex items-center"><Phone className="w-4 h-4 mr-1 text-gray-400" /> {patient.phone}</span>
                            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1 text-gray-400" /> DOB: {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Last Visit</div>
                        <div className="font-medium text-gray-900">
                            {visits.length > 0 ? new Date(visits[0].visitDate).toLocaleDateString() : 'Never'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Visit Timeline */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Visit History ({visits.length})</h3>

                {visits.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 card">No visit records found.</div>
                ) : (
                    visits.map((visit) => {
                        const notes = visit.notes || '';
                        let symptoms = visit.symptoms;
                        let clinicalNotes = notes;

                        if (!symptoms && notes.startsWith('Symptoms:')) {
                            const parts = notes.split('\n\nNotes:');
                            if (parts.length > 0) {
                                symptoms = parts[0].replace('Symptoms:', '').trim();
                                clinicalNotes = parts[1] ? parts[1].trim() : '';
                            }
                        }

                        const visitDate = visit.appointment?.appointmentDate || visit.createdAt;

                        return (
                            <div key={visit.id} className="card p-5 border-l-4 border-l-primary-500">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {new Date(visitDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Dr. {visit.doctor.name}
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                                        Visit
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    {symptoms && (
                                        <div>
                                            <div className="text-gray-500 font-medium mb-1">Symptoms</div>
                                            <div className="text-gray-900">{symptoms}</div>
                                        </div>
                                    )}
                                    {visit.diagnosis && (
                                        <div>
                                            <div className="text-gray-500 font-medium mb-1">Diagnosis</div>
                                            <div className="text-gray-900">{visit.diagnosis}</div>
                                        </div>
                                    )}
                                </div>

                                {clinicalNotes && clinicalNotes !== symptoms && (
                                    <div className="mt-2 text-sm">
                                        <div className="text-gray-500 font-medium mb-1">Notes</div>
                                        <div className="text-gray-700 whitespace-pre-wrap">{clinicalNotes}</div>
                                    </div>
                                )}

                                {visit.prescriptions && visit.prescriptions.length > 0 && (
                                    <div className="mt-4 pt-3 border-t">
                                        <div className="text-gray-500 font-medium mb-2 flex items-center">
                                            <FileText className="w-4 h-4 mr-1" /> Prescription
                                        </div>
                                        <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                                            {visit.prescriptions.map((rx: any, idx: number) => (
                                                <li key={rx.id || idx}>
                                                    <span className="font-medium">{rx.medication}</span> - {rx.dosage} ({rx.duration})
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
