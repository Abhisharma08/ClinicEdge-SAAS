'use client'

import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/api'
import {
    Search,
    Send,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    MessageSquare,
    Users,
    ChevronDown,
    ChevronUp,
} from 'lucide-react'

interface Patient {
    id: string
    name: string
    phone: string
    whatsappConsent: boolean
}

interface CampaignResult {
    patientId: string
    patientName: string
    phone: string
    status: 'sent' | 'failed' | 'skipped'
    error?: string
}

interface CampaignResponse {
    total: number
    sent: number
    failed: number
    skipped: number
    results: CampaignResult[]
}

export default function WhatsAppCampaign() {
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [templateName, setTemplateName] = useState('')
    const [params, setParams] = useState<string[]>([''])
    const [sending, setSending] = useState(false)
    const [results, setResults] = useState<CampaignResponse | null>(null)
    const [showResults, setShowResults] = useState(false)

    useEffect(() => {
        fetchPatients()
    }, [])

    async function fetchPatients() {
        try {
            const res = await api.get<any>('/patients?limit=500')
            setPatients(res.items || [])
        } catch (err) {
            console.error('Failed to load patients', err)
        } finally {
            setLoading(false)
        }
    }

    const filtered = useMemo(() => {
        if (!search.trim()) return patients
        const q = search.toLowerCase()
        return patients.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.phone?.toLowerCase().includes(q),
        )
    }, [patients, search])

    const eligibleCount = useMemo(
        () => filtered.filter((p) => p.phone && p.whatsappConsent).length,
        [filtered],
    )

    function toggleSelect(id: string) {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    function toggleAll() {
        if (selected.size === filtered.length) {
            setSelected(new Set())
        } else {
            setSelected(new Set(filtered.map((p) => p.id)))
        }
    }

    function addParam() {
        setParams([...params, ''])
    }

    function removeParam(index: number) {
        setParams(params.filter((_, i) => i !== index))
    }

    function updateParam(index: number, value: string) {
        const next = [...params]
        next[index] = value
        setParams(next)
    }

    async function handleSend() {
        if (selected.size === 0 || !templateName.trim()) return

        setSending(true)
        setResults(null)
        setShowResults(false)

        try {
            const res = await api.post<CampaignResponse>('/campaigns/send', {
                patientIds: Array.from(selected),
                templateName: templateName.trim(),
                params: params.filter((p) => p.trim()),
            })
            setResults(res)
            setShowResults(true)
        } catch (err: any) {
            alert(err.message || 'Campaign failed')
        } finally {
            setSending(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading patients...</span>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-7 h-7 text-green-600" />
                    WhatsApp Campaign
                </h1>
                <p className="text-gray-500 mt-1">
                    Select patients and send bulk WhatsApp messages via template
                </p>
            </div>

            {/* Step 1: Template Config */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                    1. Configure Template
                </h2>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Template Name
                    </label>
                    <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="e.g., health_checkup_reminder"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        Must match an approved template name in your Interakt
                        dashboard
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Template Parameters
                    </label>
                    <div className="space-y-2">
                        {params.map((p, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 w-8">
                                    {`{{${i + 1}}}`}
                                </span>
                                <input
                                    type="text"
                                    value={p}
                                    onChange={(e) =>
                                        updateParam(i, e.target.value)
                                    }
                                    placeholder={`Parameter ${i + 1}`}
                                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                />
                                {params.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeParam(i)}
                                        className="text-red-400 hover:text-red-600 text-sm"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addParam}
                        className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                        + Add Parameter
                    </button>
                </div>
            </div>

            {/* Step 2: Patient Selection */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        2. Select Patients
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {selected.size} selected
                        </span>
                        <span>|</span>
                        <span>{eligibleCount} eligible</span>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or phone..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                </div>

                {/* Patient Table */}
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={
                                            filtered.length > 0 &&
                                            selected.size === filtered.length
                                        }
                                        onChange={toggleAll}
                                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-700">
                                    Patient Name
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-700">
                                    Phone
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-700">
                                    WhatsApp
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((patient) => (
                                <tr
                                    key={patient.id}
                                    className={`hover:bg-gray-50 cursor-pointer ${selected.has(patient.id)
                                        ? 'bg-green-50'
                                        : ''
                                        }`}
                                    onClick={() => toggleSelect(patient.id)}
                                >
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selected.has(patient.id)}
                                            onChange={() =>
                                                toggleSelect(patient.id)
                                            }
                                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                        />
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {patient.name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {patient.phone || '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {patient.whatsappConsent ? (
                                            <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Opted in
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-gray-400 text-xs font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                                                <XCircle className="w-3 h-3" />
                                                No consent
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-8 text-center text-gray-400"
                                    >
                                        No patients found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Send Button */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    {selected.size > 0 && templateName.trim()
                        ? `Ready to send "${templateName}" to ${selected.size} patient(s)`
                        : 'Select patients and configure a template to send'}
                </p>
                <button
                    onClick={handleSend}
                    disabled={sending || selected.size === 0 || !templateName.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                >
                    {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                    <span>{sending ? 'Sending...' : 'Send Campaign'}</span>
                </button>
            </div>

            {/* Results */}
            {results && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <button
                        onClick={() => setShowResults(!showResults)}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50"
                    >
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Campaign Results
                            </h2>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    {results.sent} sent
                                </span>
                                {results.failed > 0 && (
                                    <span className="flex items-center gap-1 text-red-600">
                                        <XCircle className="w-4 h-4" />
                                        {results.failed} failed
                                    </span>
                                )}
                                {results.skipped > 0 && (
                                    <span className="flex items-center gap-1 text-amber-600">
                                        <AlertTriangle className="w-4 h-4" />
                                        {results.skipped} skipped
                                    </span>
                                )}
                            </div>
                        </div>
                        {showResults ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                    </button>

                    {showResults && (
                        <div className="border-t border-gray-200">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-700">
                                            Patient
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-700">
                                            Phone
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-700">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-700">
                                            Details
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {results.results.map((r, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                {r.patientName}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {r.phone}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.status === 'sent' && (
                                                    <span className="text-green-600 flex items-center gap-1">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Sent
                                                    </span>
                                                )}
                                                {r.status === 'failed' && (
                                                    <span className="text-red-600 flex items-center gap-1">
                                                        <XCircle className="w-4 h-4" />
                                                        Failed
                                                    </span>
                                                )}
                                                {r.status === 'skipped' && (
                                                    <span className="text-amber-600 flex items-center gap-1">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        Skipped
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                {r.error || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
