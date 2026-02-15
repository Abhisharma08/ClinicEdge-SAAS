'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { ArrowLeft, Calendar, User, Phone, FileText } from 'lucide-react'
import { Accordion } from '@/components/ui/Accordion'

export default function PatientHistoryPage() {
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
                            {patient.firstName && patient.lastName ? `${patient.firstName} ${patient.lastName}` : patient.name}
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
                            {visits.length > 0 ? new Date(visits[0].createdAt || visits[0].appointment?.appointmentDate).toLocaleDateString() : 'Never'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Patient Details Accordion */}
            <div className="space-y-4">
                <Accordion title="Personal Information" defaultOpen={false}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex flex-col"><span className="text-gray-500 text-xs">Full Name</span> <span className="font-medium text-gray-900">{patient.firstName && patient.lastName ? `${patient.firstName} ${patient.lastName}` : patient.name}</span></div>
                        <div className="flex flex-col"><span className="text-gray-500 text-xs">Date of Birth</span> <span className="font-medium text-gray-900">{patient.dob ? new Date(patient.dob).toLocaleDateString() : '-'}</span></div>
                        <div className="flex flex-col"><span className="text-gray-500 text-xs">Gender</span> <span className="font-medium text-gray-900">{patient.gender}</span></div>
                        <div className="flex flex-col"><span className="text-gray-500 text-xs">Blood Group</span> <span className="font-medium text-gray-900">{patient.bloodGroup || '-'}</span></div>
                    </div>
                </Accordion>

                <Accordion title="Contact Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex flex-col"><span className="text-gray-500 text-xs">Phone</span> <span className="font-medium text-gray-900">{patient.phone}</span></div>
                        <div className="flex flex-col"><span className="text-gray-500 text-xs">Email</span> <span className="font-medium text-gray-900">{patient.email || '-'}</span></div>
                        <div className="md:col-span-2 flex flex-col">
                            <span className="text-gray-500 text-xs">Address</span>
                            <span className="font-medium text-gray-900">
                                {[patient.addressLine1, patient.addressLine2, patient.city, patient.state, patient.postalCode].filter(Boolean).join(', ') || '-'}
                            </span>
                        </div>
                    </div>
                </Accordion>

                <Accordion title="Emergency & Nominee Details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="space-y-3">
                            <h4 className="font-medium text-primary-700 border-b border-primary-100 pb-1">Emergency Contact</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col"><span className="text-gray-500 text-xs">Name</span> <span>{patient.emergencyName || '-'}</span></div>
                                <div className="flex flex-col"><span className="text-gray-500 text-xs">Relation</span> <span>{patient.emergencyRelationship || '-'}</span></div>
                                <div className="flex flex-col col-span-2"><span className="text-gray-500 text-xs">Phone</span> <span>{patient.emergencyPhone || '-'}</span></div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-medium text-primary-700 border-b border-primary-100 pb-1">Nominee</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col"><span className="text-gray-500 text-xs">Name</span> <span>{patient.nomineeName || '-'}</span></div>
                                <div className="flex flex-col"><span className="text-gray-500 text-xs">Relation</span> <span>{patient.nomineeRelationship || '-'}</span></div>
                                <div className="flex flex-col col-span-2"><span className="text-gray-500 text-xs">Phone</span> <span>{patient.nomineePhone || '-'}</span></div>
                            </div>
                        </div>
                    </div>
                </Accordion>

                <Accordion title="Medical Profile">
                    <div className="grid grid-cols-1 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500 text-xs block mb-1">Allergies</span>
                            <div className="bg-red-50 text-red-800 p-2 rounded-md border border-red-100 text-sm">{patient.allergies || 'No known allergies'}</div>
                        </div>
                        <div>
                            <span className="text-gray-500 text-xs block mb-1">Medical History</span>
                            <div className="bg-gray-50 text-gray-800 p-2 rounded-md border border-gray-100 text-sm whitespace-pre-wrap">{patient.medicalHistory || 'No recorded medical history'}</div>
                        </div>
                        <div className="flex gap-4 pt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${patient.whatsappConsent ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                WhatsApp: {patient.whatsappConsent ? 'Yes' : 'No'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${patient.dpdpConsent ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                DPDP: {patient.dpdpConsent ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>
                </Accordion>
            </div>

            {/* Visit Timeline */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Visit History ({visits.length})</h3>

                {visits.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 card">No visit records found.</div>
                ) : (
                    visits.map((visit) => {
                        // Use database symptoms or fallback to notes parsing for old records
                        const notes = visit.notes || '';
                        let symptoms = visit.symptoms;
                        let clinicalNotes = notes;

                        // Parse legacy notes format "Symptoms: ... \n\nNotes: ..." if symptoms field is empty
                        if (!symptoms && notes.startsWith('Symptoms:')) {
                            const parts = notes.split('\n\nNotes:');
                            if (parts.length > 0) {
                                symptoms = parts[0].replace('Symptoms:', '').trim();
                                clinicalNotes = parts[1] ? parts[1].trim() : '';
                            }
                        }

                        // Determine date
                        const visitDate = visit.createdAt || visit.appointment?.appointmentDate;

                        return (
                            <div key={visit.id} className="card p-5 border-l-4 border-l-primary-500">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {new Date(visitDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            <span className="text-gray-500 ml-1 font-normal text-sm">
                                                at {new Date(visitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Dr. {visit.doctor?.name || 'Unknown'}
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
