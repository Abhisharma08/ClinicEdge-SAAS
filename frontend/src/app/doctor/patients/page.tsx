'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import {
    Users, Plus, Edit2, FileClock, Search, Trash2, Download, Upload,
    X, ChevronLeft, ChevronRight, Check, AlertCircle,
    ChevronUp, ChevronDown, Filter, RotateCcw
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import Link from 'next/link'

const INITIAL_FORM = {
    firstName: '', lastName: '', phone: '', dob: '', gender: 'MALE', email: '',
    addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'India',
    emergencyName: '', emergencyRelationship: '', emergencyPhone: '',
    nomineeName: '', nomineeRelationship: '', nomineePhone: '',
    bloodGroup: '', allergies: '', medicalHistory: '',
    whatsappConsent: false, dpdpConsent: false,
}

const STEPS = ['Basic Info', 'Address', 'Emergency Contact', 'Nominee', 'Medical', 'Consent']
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const GENDERS = [
    { value: '', label: 'All Genders' },
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
]

function DoctorPatientsPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [patients, setPatients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ ...INITIAL_FORM })
    const [submitting, setSubmitting] = useState(false)
    const [step, setStep] = useState(0)
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [genderFilter, setGenderFilter] = useState('')
    const [bloodGroupFilter, setBloodGroupFilter] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    // Sorting
    const [sortBy, setSortBy] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    // Pagination
    const [page, setPage] = useState(1)
    const [limit] = useState(20)
    const [meta, setMeta] = useState<any>({ total: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false })

    // Import state
    const [importResult, setImportResult] = useState<any>(null)
    const [importing, setImporting] = useState(false)

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            const u = JSON.parse(userData)
            setUser(u)
            if (u.clinicId) fetchPatients(u.clinicId)
            else fetchPatients() // Fallback if no clinicId in local storage, reliance on token
        } else {
            fetchPatients()
        }
        if (searchParams.get('action') === 'new') openNewModal()
    }, [searchParams])

    useEffect(() => {
        const t = setTimeout(() => {
            fetchPatients()
        }, 400)
        return () => clearTimeout(t)
    }, [searchQuery, fromDate, toDate, genderFilter, bloodGroupFilter, sortBy, sortOrder, page])

    async function fetchPatients(clinicId?: string) {
        setLoading(true)
        try {
            const q = new URLSearchParams()
            if (searchQuery) q.append('search', searchQuery)
            if (fromDate) q.append('fromDate', fromDate)
            if (toDate) q.append('toDate', toDate)
            if (genderFilter) q.append('gender', genderFilter)
            if (bloodGroupFilter) q.append('bloodGroup', bloodGroupFilter)
            if (sortBy) q.append('sortBy', sortBy)
            if (sortOrder) q.append('sortOrder', sortOrder)
            q.append('page', String(page))
            q.append('limit', String(limit))
            const res = await api.get<any>(`/patients?${q.toString()}`)
            setPatients(res.items || [])
            if (res.meta) setMeta(res.meta)
        } catch { } finally { setLoading(false) }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this patient?')) return
        try {
            await api.delete(`/patients/${id}`)
            fetchPatients()
        } catch { alert('Failed to delete patient') }
    }

    function validateStep() {
        const errs: Record<string, string> = {}
        if (step === 0) {
            if (!formData.firstName.trim()) errs.firstName = 'Required'
            if (!formData.lastName.trim()) errs.lastName = 'Required'
            if (!formData.phone.trim()) errs.phone = 'Required'
            else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.trim())) errs.phone = 'Invalid phone format'
            if (!formData.dob) errs.dob = 'Required'
            if (!formData.gender) errs.gender = 'Required'
        }
        if (step === 1) {
            if (!formData.addressLine1.trim()) errs.addressLine1 = 'Required'
            if (!formData.city.trim()) errs.city = 'Required'
            if (!formData.state.trim()) errs.state = 'Required'
            if (!formData.postalCode.trim()) errs.postalCode = 'Required'
        }
        if (step === 2) {
            if (!formData.emergencyName.trim()) errs.emergencyName = 'Required'
            if (!formData.emergencyRelationship.trim()) errs.emergencyRelationship = 'Required'
            if (!formData.emergencyPhone.trim()) errs.emergencyPhone = 'Required'
        }
        if (step === 5 && !formData.dpdpConsent && !editingId) {
            errs.dpdpConsent = 'DPDP consent is required'
        }
        setFormErrors(errs)
        return Object.keys(errs).length === 0
    }

    function nextStep() {
        if (!validateStep()) return
        setStep(s => Math.min(s + 1, STEPS.length - 1))
    }

    function prevStep() { setStep(s => Math.max(s - 1, 0)) }

    async function handleSubmit(e?: React.FormEvent) {
        e?.preventDefault()
        if (!validateStep()) return
        setSubmitting(true)
        try {
            const raw = {
                ...formData,
                dob: formData.dob ? new Date(formData.dob).toISOString() : undefined,
                email: formData.email || null,
                addressLine2: formData.addressLine2 || null,
                nomineeName: formData.nomineeName || null,
                nomineeRelationship: formData.nomineeRelationship || null,
                nomineePhone: formData.nomineePhone || null,
                bloodGroup: formData.bloodGroup || null,
                allergies: formData.allergies || null,
                medicalHistory: formData.medicalHistory || null,
            }
            // Strip undefined, but keep nulls to clear fields
            const payload = Object.fromEntries(Object.entries(raw).filter(([_, v]) => v !== undefined))
            if (editingId) {
                const { phone, ...updatePayload } = payload
                await api.put(`/patients/${editingId}`, updatePayload)
                alert('Patient updated successfully')
            } else {
                await api.post('/patients', payload)
                alert('Patient registered successfully')
            }
            setIsModalOpen(false)
            setFormData({ ...INITIAL_FORM })
            setEditingId(null)
            setStep(0)
            fetchPatients()
        } catch { alert('Failed to save patient') }
        finally { setSubmitting(false) }
    }

    function handleEdit(patient: any) {
        setEditingId(patient.id)
        setFormData({
            firstName: patient.firstName || patient.name?.split(' ')[0] || '',
            lastName: patient.lastName || patient.name?.split(' ').slice(1).join(' ') || '',
            phone: patient.phone || '',
            dob: patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : '',
            gender: patient.gender || 'MALE',
            email: patient.email || '',
            addressLine1: patient.addressLine1 || '',
            addressLine2: patient.addressLine2 || '',
            city: patient.city || '',
            state: patient.state || '',
            postalCode: patient.postalCode || '',
            country: patient.country || 'India',
            emergencyName: patient.emergencyName || '',
            emergencyRelationship: patient.emergencyRelationship || '',
            emergencyPhone: patient.emergencyPhone || '',
            nomineeName: patient.nomineeName || '',
            nomineeRelationship: patient.nomineeRelationship || '',
            nomineePhone: patient.nomineePhone || '',
            bloodGroup: patient.bloodGroup || '',
            allergies: patient.allergies || '',
            medicalHistory: patient.medicalHistory || '',
            whatsappConsent: patient.whatsappConsent || false,
            dpdpConsent: patient.dpdpConsent || false,
        })
        setStep(0)
        setIsModalOpen(true)
    }

    function openNewModal() {
        setEditingId(null); setFormData({ ...INITIAL_FORM }); setStep(0); setFormErrors({}); setIsModalOpen(true)
    }

    async function handleExport(format: 'csv' | 'xlsx') {
        try {
            const res = await fetch(`/api/patients/export?format=${format}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
            })
            if (!res.ok) throw new Error('Export failed')
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url
            a.download = `patients.${format}`; a.click(); URL.revokeObjectURL(url)
        } catch { alert('Export failed') }
    }

    async function handleDownloadSample() {
        const headers = ['firstName', 'lastName', 'phone', 'dob', 'gender', 'email', 'addressLine1', 'city', 'state', 'postalCode']
        const sample = ['John,Doe,+919876543210,1990-01-01,MALE,john@example.com,123 Main St,Mumbai,Maharashtra,400001']
        const csvContent = [headers.join(','), ...sample].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url
        a.download = 'patients_sample.csv'; a.click(); URL.revokeObjectURL(url)
    }

    async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setImporting(true); setImportResult(null)
        try {
            const fd = new FormData(); fd.append('file', file)
            const res = await fetch(`/api/patients/import`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
                body: fd,
            })
            const result = await res.json()
            setImportResult(result)
            fetchPatients()
        } catch { alert('Import failed') }
        finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = '' }
    }

    function handleSort(field: string) {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortOrder('asc')
        }
        setPage(1)
    }

    function clearAllFilters() {
        setSearchQuery('')
        setFromDate('')
        setToDate('')
        setGenderFilter('')
        setBloodGroupFilter('')
        setPage(1)
    }

    const hasActiveFilters = searchQuery || fromDate || toDate || genderFilter || bloodGroupFilter

    function calcAge(dob: string) {
        if (!dob) return '-'
        const age = Math.floor((Date.now() - new Date(dob).getTime()) / 31536000000)
        return `${age}y`
    }

    const SortIcon = ({ field }: { field: string }) => {
        if (sortBy !== field) return <ChevronUp className="w-3 h-3 text-gray-300" />
        return sortOrder === 'asc'
            ? <ChevronUp className="w-3 h-3 text-primary-600" />
            : <ChevronDown className="w-3 h-3 text-primary-600" />
    }

    const set = (field: string, value: any) => setFormData(f => ({ ...f, [field]: value }))
    const inp = (field: string, label: string, opts?: { type?: string; required?: boolean; placeholder?: string; disabled?: boolean }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {opts?.required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={opts?.type || 'text'}
                disabled={opts?.disabled}
                className={`input w-full ${formErrors[field] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                value={(formData as any)[field]}
                onChange={e => set(field, e.target.value)}
                placeholder={opts?.placeholder}
            />
            {formErrors[field] && <p className="text-red-500 text-xs mt-1">{formErrors[field]}</p>}
        </div>
    )

    const stepContent = () => {
        switch (step) {
            case 0: return (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {inp('firstName', 'First Name', { required: true })}
                        {inp('lastName', 'Last Name', { required: true })}
                    </div>
                    {inp('phone', 'Phone Number', { required: true, placeholder: '+919876500001', disabled: !!editingId })}
                    <div className="grid grid-cols-2 gap-4">
                        {inp('dob', 'Date of Birth', { type: 'date', required: true })}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
                            <select className="input w-full" value={formData.gender} onChange={e => set('gender', e.target.value)}>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>
                    {inp('email', 'Email', { type: 'email', placeholder: 'patient@example.com' })}
                </div>
            )
            case 1: return (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Address Details</h3>
                    {inp('addressLine1', 'Address Line 1', { required: true, placeholder: '12 MG Road' })}
                    {inp('addressLine2', 'Address Line 2', { placeholder: 'Near City Mall' })}
                    <div className="grid grid-cols-2 gap-4">
                        {inp('city', 'City', { required: true })}
                        {inp('state', 'State', { required: true })}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {inp('postalCode', 'Postal Code', { required: true, placeholder: '400001' })}
                        {inp('country', 'Country')}
                    </div>
                </div>
            )
            case 2: return (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Emergency Contact</h3>
                    {inp('emergencyName', 'Contact Name', { required: true })}
                    {inp('emergencyRelationship', 'Relationship', { required: true, placeholder: 'Spouse / Parent / Sibling' })}
                    {inp('emergencyPhone', 'Contact Phone', { required: true, placeholder: '+919876500002' })}
                </div>
            )
            case 3: return (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Nominee Details <span className="text-sm font-normal text-gray-500">(Optional)</span></h3>
                    {inp('nomineeName', 'Nominee Name')}
                    {inp('nomineeRelationship', 'Relationship')}
                    {inp('nomineePhone', 'Nominee Phone')}
                </div>
            )
            case 4: return (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Medical Information <span className="text-sm font-normal text-gray-500">(Optional)</span></h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                            <select className="input w-full" value={formData.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
                                <option value="">Select</option>
                                {BLOOD_GROUPS.map(bg => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                        <textarea className="input w-full" rows={2} value={formData.allergies}
                            onChange={e => set('allergies', e.target.value)} placeholder="Peanuts, Penicillin..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
                        <textarea className="input w-full" rows={2} value={formData.medicalHistory}
                            onChange={e => set('medicalHistory', e.target.value)} placeholder="Diabetes, Hypertension..." />
                    </div>
                </div>
            )
            case 5: return (
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Consent</h3>
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            checked={formData.whatsappConsent} onChange={e => set('whatsappConsent', e.target.checked)} />
                        <span className="text-sm text-gray-700">I consent to receive appointment reminders and clinic notifications via WhatsApp.</span>
                    </label>
                    <div className={`flex items-start gap-3 p-4 rounded-lg border-2 ${formErrors.dpdpConsent ? 'border-red-500 bg-red-50' : formData.dpdpConsent ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                        <input type="checkbox" className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            checked={formData.dpdpConsent} onChange={e => set('dpdpConsent', e.target.checked)} />
                        <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900 block mb-1">DPDP Act 2023 Consent <span className="text-red-500">*</span></span>
                            <p className="text-xs text-gray-600">
                                I hereby provide my informed consent for the collection, storage, and processing of my personal data
                                in accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act). I understand that my data
                                will be used solely for healthcare purposes, including medical records, treatment, appointment management,
                                and communication. I have the right to withdraw this consent at any time by contacting the clinic.
                            </p>
                        </div>
                    </div>
                    {formErrors.dpdpConsent && <p className="text-red-500 text-xs mt-1">{formErrors.dpdpConsent}</p>}
                </div>
            )
        }
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {meta.total} {meta.total === 1 ? 'patient' : 'patients'} total
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => handleExport('csv')} className="btn-outline flex items-center text-sm gap-1" title="Export CSV">
                        <Download className="w-4 h-4" /> CSV
                    </button>
                    <label className="btn-outline flex items-center text-sm gap-1 cursor-pointer">
                        <Upload className="w-4 h-4" /> Import CSV
                        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
                    </label>
                    <button onClick={handleDownloadSample} className="text-xs text-primary-600 hover:text-primary-700 underline px-1">
                        Sample CSV
                    </button>
                    <button onClick={openNewModal} className="btn-primary flex items-center text-sm gap-1">
                        <Plus className="w-4 h-4" /> Register Patient
                    </button>
                </div>
            </div>

            {/* Search + Filter Toggle */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" placeholder="Search by name, phone, or email..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1) }} />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${showFilters || hasActiveFilters
                        ? 'bg-primary-50 border-primary-300 text-primary-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <Filter className="w-4 h-4" />
                    Filters
                    {hasActiveFilters && (
                        <span className="ml-1 w-5 h-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">
                            {[searchQuery, fromDate, toDate, genderFilter, bloodGroupFilter].filter(Boolean).length}
                        </span>
                    )}
                </button>
                {hasActiveFilters && (
                    <button onClick={clearAllFilters} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors">
                        <RotateCcw className="w-3.5 h-3.5" /> Clear all
                    </button>
                )}
            </div>

            {/* Collapsible Filter Panel */}
            {showFilters && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
                        <select className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            value={genderFilter} onChange={e => { setGenderFilter(e.target.value); setPage(1) }}>
                            {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Blood Group</label>
                        <select className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            value={bloodGroupFilter} onChange={e => { setBloodGroupFilter(e.target.value); setPage(1) }}>
                            <option value="">All</option>
                            {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
                        <input type="date" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                            value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1) }} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
                        <input type="date" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                            value={toDate} onChange={e => { setToDate(e.target.value); setPage(1) }} />
                    </div>
                </div>
            )}

            {/* Active Filter Pills */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {genderFilter && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                            Gender: {genderFilter}
                            <button onClick={() => setGenderFilter('')}><X className="w-3 h-3" /></button>
                        </span>
                    )}
                    {bloodGroupFilter && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                            Blood: {bloodGroupFilter}
                            <button onClick={() => setBloodGroupFilter('')}><X className="w-3 h-3" /></button>
                        </span>
                    )}
                    {fromDate && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                            From: {fromDate}
                            <button onClick={() => setFromDate('')}><X className="w-3 h-3" /></button>
                        </span>
                    )}
                    {toDate && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                            To: {toDate}
                            <button onClick={() => setToDate('')}><X className="w-3 h-3" /></button>
                        </span>
                    )}
                </div>
            )}

            {/* Import Result Banner */}
            {importResult && (
                <div className={`p-4 rounded-lg border ${importResult.errors?.length ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        {importResult.errors?.length ? <AlertCircle className="w-5 h-5 text-yellow-600" /> : <Check className="w-5 h-5 text-green-600" />}
                        <span className="font-medium">{importResult.success} of {importResult.total} imported successfully</span>
                    </div>
                    {importResult.errors?.length > 0 && (
                        <details className="text-sm text-yellow-800">
                            <summary className="cursor-pointer">View {importResult.errors.length} error(s)</summary>
                            <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                                {importResult.errors.map((e: any, i: number) => (
                                    <li key={i}>Row {e.row}: {e.error}</li>
                                ))}
                            </ul>
                        </details>
                    )}
                    <button onClick={() => setImportResult(null)} className="mt-2 text-xs text-gray-500 hover:text-gray-700">Dismiss</button>
                </div>
            )}

            {/* Patient Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('firstName')}>
                                    <div className="flex items-center gap-1">Name <SortIcon field="firstName" /></div>
                                </th>
                                <th className="px-4 py-3 font-medium text-gray-600 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('phone')}>
                                    <div className="flex items-center gap-1">Phone <SortIcon field="phone" /></div>
                                </th>
                                <th className="px-4 py-3 font-medium text-gray-600 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('gender')}>
                                    <div className="flex items-center gap-1">Gender <SortIcon field="gender" /></div>
                                </th>
                                <th className="px-4 py-3 font-medium text-gray-600 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('dob')}>
                                    <div className="flex items-center gap-1">Age <SortIcon field="dob" /></div>
                                </th>
                                <th className="px-4 py-3 font-medium text-gray-600 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('city')}>
                                    <div className="flex items-center gap-1">City <SortIcon field="city" /></div>
                                </th>
                                <th className="px-4 py-3 font-medium text-gray-600">Blood</th>
                                <th className="px-4 py-3 font-medium text-gray-600 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('createdAt')}>
                                    <div className="flex items-center gap-1">Registered <SortIcon field="createdAt" /></div>
                                </th>
                                <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                        Loading patients...
                                    </div>
                                </td></tr>
                            ) : patients.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                                    <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                    <p className="font-medium text-gray-500">No patients found</p>
                                    <p className="text-sm">Try adjusting your filters or add a new patient.</p>
                                </td></tr>
                            ) : patients.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                    onClick={() => router.push(`/doctor/patients/${p.id}`)}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                                {(p.firstName || p.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-gray-900 group-hover:text-primary-700 transition-colors">
                                                {p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{p.phone}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.gender === 'MALE' ? 'bg-blue-100 text-blue-700' :
                                            p.gender === 'FEMALE' ? 'bg-pink-100 text-pink-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>{p.gender || '-'}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{calcAge(p.dob)}</td>
                                    <td className="px-4 py-3 text-gray-600">{p.city || '-'}</td>
                                    <td className="px-4 py-3">
                                        {p.bloodGroup ? (
                                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                {p.bloodGroup}
                                            </span>
                                        ) : <span className="text-gray-300">-</span>}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => router.push(`/doctor/patients/${p.id}`)}
                                                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-700" title="View History">
                                                <FileClock className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleEdit(p)}
                                                className="p-1.5 hover:bg-blue-50 rounded-md text-gray-500 hover:text-blue-600" title="Edit">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(p.id)}
                                                className="p-1.5 hover:bg-red-50 rounded-md text-gray-500 hover:text-red-600" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                        <p className="text-sm text-gray-600">
                            Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(page * limit, meta.total)}</span> of{' '}
                            <span className="font-medium">{meta.total}</span>
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(1)} disabled={!meta.hasPreviousPage}
                                className="px-2 py-1 text-sm rounded border border-gray-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed">
                                First
                            </button>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!meta.hasPreviousPage}
                                className="p-1.5 rounded border border-gray-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                                let pageNum: number
                                if (meta.totalPages <= 5) {
                                    pageNum = i + 1
                                } else if (page <= 3) {
                                    pageNum = i + 1
                                } else if (page >= meta.totalPages - 2) {
                                    pageNum = meta.totalPages - 4 + i
                                } else {
                                    pageNum = page - 2 + i
                                }
                                return (
                                    <button key={pageNum} onClick={() => setPage(pageNum)}
                                        className={`w-8 h-8 text-sm rounded ${pageNum === page
                                            ? 'bg-primary-600 text-white font-medium'
                                            : 'border border-gray-300 hover:bg-white text-gray-600'
                                            }`}>
                                        {pageNum}
                                    </button>
                                )
                            })}
                            <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={!meta.hasNextPage}
                                className="p-1.5 rounded border border-gray-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <button onClick={() => setPage(meta.totalPages)} disabled={!meta.hasNextPage}
                                className="px-2 py-1 text-sm rounded border border-gray-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed">
                                Last
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Registration Modal — Multi-step */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Edit Patient' : 'Register New Patient'}
                size="lg"
                footer={
                    <div className="flex justify-between w-full">
                        <button onClick={() => { if (step > 0) prevStep(); else setIsModalOpen(false) }}
                            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center gap-1">
                            <ChevronLeft className="w-4 h-4" /> {step > 0 ? 'Back' : 'Cancel'}
                        </button>
                        <div className="flex gap-2">
                            {editingId && (
                                <button onClick={handleSubmit} disabled={submitting} type="button"
                                    className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-1">
                                    {submitting ? 'Saving...' : 'Update'}
                                </button>
                            )}
                            {step < STEPS.length - 1 ? (
                                <button onClick={nextStep} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1">
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                !editingId && (
                                    <button onClick={handleSubmit} disabled={submitting}
                                        className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1">
                                        {submitting ? 'Saving...' : 'Register Patient'}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                }
            >
                {/* Step Indicator */}
                <div className="flex items-center justify-center mb-6 gap-1">
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex items-center">
                            <button
                                onClick={() => { if (i < step) setStep(i) }}
                                className={`w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${i < step ? 'bg-primary-600 text-white cursor-pointer' :
                                    i === step ? 'bg-primary-100 text-primary-700 border-2 border-primary-600' :
                                        'bg-gray-100 text-gray-400'
                                    }`}
                            >
                                {i < step ? <Check className="w-4 h-4" /> : i + 1}
                            </button>
                            {i < STEPS.length - 1 && <div className={`w-6 h-0.5 mx-0.5 ${i < step ? 'bg-primary-600' : 'bg-gray-200'}`} />}
                        </div>
                    ))}
                </div>
                <p className="text-sm text-gray-500 text-center mb-4">{STEPS[step]}</p>

                {stepContent()}
            </Modal>

        </div >
    )
}

export default function DoctorPatientsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
            <DoctorPatientsPageContent />
        </Suspense>
    )
}
