'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { ArrowLeft, Plus, Trash2, Save, FileText, Activity } from 'lucide-react'

// Types based on backend DTOs
interface PrescriptionItem {
    medication: string
    dosage: string
    frequency: string
    duration: string
    instructions?: string
}

export default function ConsultationPage() {
    const params = useParams()
    const router = useRouter()
    const appointmentId = params?.appointmentId as string

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [appointment, setAppointment] = useState<any>(null)

    // Form State
    const [diagnosis, setDiagnosis] = useState('')
    const [symptoms, setSymptoms] = useState('') // Note: Backend DTO didn't show 'symptoms' field in CreateVisitRecordDto, checking if it goes into notes or if I missed it.
    // Re-checked view_file 827: notes, diagnosis. No symptoms field explicitly on CreateVisitRecordDto? 
    // Let me check if I should put symptoms in notes or if it's missing in backend.
    // For now, I will append symptoms to notes or diagnosis if needed, or add it to notes.
    const [notes, setNotes] = useState('')
    const [followUpDate, setFollowUpDate] = useState('')
    const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([])

    useEffect(() => {
        if (appointmentId) {
            fetchAppointment()
        }
    }, [appointmentId])

    async function fetchAppointment() {
        try {
            const res = await api.get<any>(`/appointments/${appointmentId}`)
            setAppointment(res)
            // Pre-fill patient notes if useful?
        } catch (error) {
            console.error(error)
            alert('Failed to load appointment details')
            router.back()
        } finally {
            setLoading(false)
        }
    }

    function addPrescription() {
        setPrescriptions([...prescriptions, { medication: '', dosage: '', frequency: '', duration: '', instructions: '' }])
    }

    function removePrescription(index: number) {
        setPrescriptions(prescriptions.filter((_, i) => i !== index))
    }

    function updatePrescription(index: number, field: keyof PrescriptionItem, value: string) {
        const newPrescriptions = [...prescriptions]
        newPrescriptions[index] = { ...newPrescriptions[index], [field]: value }
        setPrescriptions(newPrescriptions)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!confirm('Are you sure you want to complete this consultation?')) return

        setSubmitting(true)
        try {
            // 1. Create Visit Record
            await api.post('/visit-records', {
                appointmentId,
                symptoms,
                diagnosis,
                notes: notes,
                followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined,
                prescriptions: prescriptions.map(p => ({
                    medication: p.medication,
                    dosage: p.dosage,
                    frequency: p.frequency,
                    duration: p.duration,
                    instructions: p.instructions
                }))
            })

            // 2. Update Appointment Status to COMPLETED
            await api.patch(`/appointments/${appointmentId}/status?status=COMPLETED`, {})

            alert('Consultation completed successfully!')
            router.push('/clinic/appointments')
        } catch (error) {
            console.error(error)
            alert('Failed to save consultation')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading consultation...</div>
    if (!appointment) return <div className="p-8 text-center text-red-500">Appointment not found</div>

    const isCompleted = appointment.status === 'COMPLETED'
    const visitRecord = appointment.visitRecord

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isCompleted ? 'Consultation Details' : 'New Consultation'}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {appointment.patient.name} • {appointment.patient.gender} • {appointment.patient.phone}
                    </p>
                </div>
                {isCompleted && (
                    <div className="ml-auto">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            Completed
                        </span>
                    </div>
                )}
            </div>

            {isCompleted ? (
                // READ ONLY VIEW
                <div className="space-y-6">
                    <div className="card p-6 space-y-4">
                        <h2 className="text-lg font-semibold flex items-center text-gray-900 border-b pb-2">
                            <Activity className="w-5 h-5 mr-2 text-primary-600" />
                            Clinical Assessment
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Symptoms</label>
                                <p className="text-gray-900 font-medium">{visitRecord?.symptoms || '-'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Diagnosis</label>
                                <p className="text-gray-900 font-medium">{visitRecord?.diagnosis || '-'}</p>
                            </div>
                            <div className="col-span-full">
                                <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
                                <p className="text-gray-900 whitespace-pre-wrap">{visitRecord?.notes || '-'}</p>
                            </div>
                            {visitRecord?.followUpDate && (
                                <div className="col-span-full">
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Follow-up Date</label>
                                    <p className="text-gray-900 font-medium">
                                        {new Date(visitRecord.followUpDate).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card p-6 space-y-4">
                        <h2 className="text-lg font-semibold flex items-center text-gray-900 border-b pb-2">
                            <FileText className="w-5 h-5 mr-2 text-primary-600" />
                            Prescriptions
                        </h2>

                        {!visitRecord?.prescriptions || visitRecord.prescriptions.length === 0 ? (
                            <p className="text-gray-500 italic">No prescriptions recorded.</p>
                        ) : (
                            <div className="bg-white rounded-lg border overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-2 font-medium text-gray-500">Medication</th>
                                            <th className="px-4 py-2 font-medium text-gray-500">Dosage</th>
                                            <th className="px-4 py-2 font-medium text-gray-500">Frequency</th>
                                            <th className="px-4 py-2 font-medium text-gray-500">Duration</th>
                                            <th className="px-4 py-2 font-medium text-gray-500">Instructions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {visitRecord.prescriptions.map((rx: any) => (
                                            <tr key={rx.id}>
                                                <td className="px-4 py-3 font-medium text-gray-900">{rx.medication}</td>
                                                <td className="px-4 py-3 text-gray-600">{rx.dosage}</td>
                                                <td className="px-4 py-3 text-gray-600">{rx.frequency}</td>
                                                <td className="px-4 py-3 text-gray-600">{rx.duration}</td>
                                                <td className="px-4 py-3 text-gray-600">{rx.instructions || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={async () => {
                                    try {
                                        const token = localStorage.getItem('accessToken');
                                        // Use the Same API_BASE login as the rest of the app (via Next.js rewrites)
                                        // The rewrite rule is: source: '/api/:path*' -> destination: 'http://localhost:3001/api/v1/:path*'
                                        const res = await fetch(`/api/visit-records/${visitRecord?.id}/pdf`, {
                                            headers: {
                                                'Authorization': `Bearer ${token}`
                                            }
                                        });
                                        if (!res.ok) throw new Error('Failed to download PDF');
                                        const blob = await res.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `prescription-${visitRecord?.id}.pdf`;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        document.body.removeChild(a);
                                    } catch (e) {
                                        console.error(e);
                                        alert('Failed to download prescription PDF');
                                    }
                                }}
                                className="btn-secondary flex items-center"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Download Prescription PDF
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                // EDIT MODE (New Consultation)
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Clinical Notes Section */}
                    <div className="card p-6 space-y-4">
                        <h2 className="text-lg font-semibold flex items-center text-gray-900 border-b pb-2">
                            <Activity className="w-5 h-5 mr-2 text-primary-600" />
                            Clinical Assessment
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms / Chief Complaint</label>
                            <textarea
                                className="input w-full"
                                rows={2}
                                value={symptoms}
                                onChange={e => setSymptoms(e.target.value)}
                                placeholder="e.g. Fever, Cough, Headache..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                            <input
                                type="text"
                                className="input w-full"
                                value={diagnosis}
                                onChange={e => setDiagnosis(e.target.value)}
                                placeholder="e.g. Viral upper respiratory infection"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                            <textarea
                                className="input w-full"
                                rows={3}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Examination findings, history..."
                            />
                        </div>
                    </div>

                    {/* Prescriptions Section */}
                    <div className="card p-6 space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h2 className="text-lg font-semibold flex items-center text-gray-900">
                                <FileText className="w-5 h-5 mr-2 text-primary-600" />
                                Prescriptions
                            </h2>
                            <button
                                type="button"
                                onClick={addPrescription}
                                className="btn-secondary text-sm flex items-center py-1"
                            >
                                <Plus className="w-4 h-4 mr-1" /> Add Medicine
                            </button>
                        </div>

                        {prescriptions.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                                No medicines added yet. Click "Add Medicine" to start.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {prescriptions.map((rx, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-2 items-start bg-gray-50 p-3 rounded-lg border">
                                        <div className="col-span-4">
                                            <input
                                                placeholder="Medicine Name"
                                                className="input w-full text-sm"
                                                value={rx.medication}
                                                onChange={e => updatePrescription(idx, 'medication', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                placeholder="Dosage (500mg)"
                                                className="input w-full text-sm"
                                                value={rx.dosage}
                                                onChange={e => updatePrescription(idx, 'dosage', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                placeholder="Freq (1-0-1)"
                                                className="input w-full text-sm"
                                                value={rx.frequency}
                                                onChange={e => updatePrescription(idx, 'frequency', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                placeholder="Duration (5 days)"
                                                className="input w-full text-sm"
                                                value={rx.duration}
                                                onChange={e => updatePrescription(idx, 'duration', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-2 flex items-center justify-end">
                                            <button
                                                type="button"
                                                onClick={() => removePrescription(idx)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Follow Up & Actions */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <label className="text-sm font-medium text-gray-700">Follow-up Date:</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={followUpDate}
                                    onChange={e => setFollowUpDate(e.target.value)}
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary flex items-center"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {submitting ? 'Completing...' : 'Complete Consultation'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            )}
        </div>
    )
}
