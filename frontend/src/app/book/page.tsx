'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Building2, ArrowRight, ArrowLeft, Check } from 'lucide-react'

interface Clinic {
    id: string
    name: string
    address: string
    specialists: { id: string; name: string }[]
}

interface Doctor {
    id: string
    name: string
    schedule: any
}

interface TimeSlot {
    start: string
    end: string
    available: boolean
}

const STEPS = ['Clinic', 'Specialist', 'Doctor', 'Date & Time', 'Confirm']

export default function BookingPage() {
    const [step, setStep] = useState(0)
    const [clinics, setClinics] = useState<Clinic[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Booking state
    const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)
    const [selectedSpecialist, setSelectedSpecialist] = useState<{ id: string; name: string } | null>(null)
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
    const [selectedDate, setSelectedDate] = useState('')
    const [slots, setSlots] = useState<TimeSlot[]>([])
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
    const [patientInfo, setPatientInfo] = useState({
        name: '',
        phone: '',
        notes: '',
    })
    const [bookingComplete, setBookingComplete] = useState(false)
    const [bookingId, setBookingId] = useState('')

    // Fetch clinics on mount
    useEffect(() => {
        fetchClinics()
    }, [])

    // Fetch doctors when specialist is selected
    useEffect(() => {
        if (selectedClinic && selectedSpecialist) {
            fetchDoctors()
        }
    }, [selectedClinic, selectedSpecialist])

    // Fetch slots when doctor and date are selected
    useEffect(() => {
        if (selectedDoctor && selectedDate && selectedClinic) {
            fetchSlots()
        }
    }, [selectedDoctor, selectedDate])

    async function fetchClinics() {
        setLoading(true)
        try {
            const res = await fetch('/api/clinics/public')
            const data = await res.json()
            setClinics(data.items || [])
        } catch (err) {
            setError('Failed to load clinics')
        } finally {
            setLoading(false)
        }
    }

    async function fetchDoctors() {
        setLoading(true)
        try {
            const res = await fetch(
                `/api/doctors?clinicId=${selectedClinic!.id}&specialistId=${selectedSpecialist!.id}`
            )
            const data = await res.json()
            setDoctors(data.items || [])
        } catch (err) {
            setError('Failed to load doctors')
        } finally {
            setLoading(false)
        }
    }

    async function fetchSlots() {
        setLoading(true)
        try {
            const res = await fetch(
                `/api/appointments/slots?clinicId=${selectedClinic!.id}&doctorId=${selectedDoctor!.id}&date=${selectedDate}`
            )
            const data = await res.json()
            setSlots(data || [])
        } catch (err) {
            setError('Failed to load slots')
        } finally {
            setLoading(false)
        }
    }

    async function handleBooking() {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/appointments/public', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clinicId: selectedClinic!.id,
                    doctorId: selectedDoctor!.id,
                    specialistId: selectedSpecialist!.id,
                    appointmentDate: selectedDate,
                    startTime: selectedSlot!.start,
                    endTime: selectedSlot!.end,
                    patientInfo,
                }),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.message || 'Booking failed')
            }

            const data = await res.json()
            setBookingId(data.id)
            setBookingComplete(true)
        } catch (err: any) {
            setError(err.message || 'Failed to complete booking')
        } finally {
            setLoading(false)
        }
    }

    function getNextAvailableDates() {
        const dates = []
        const today = new Date()
        for (let i = 0; i <= 14; i++) {
            const date = new Date(today)
            date.setDate(today.getDate() + i)
            dates.push(date.toISOString().split('T')[0])
        }
        return dates
    }

    if (bookingComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="card p-12 text-center max-w-md w-full animate-in">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
                    <p className="text-gray-600 mb-6">
                        Your appointment has been booked. You will receive a WhatsApp confirmation shortly.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                        <p className="text-sm text-gray-500">Booking Reference</p>
                        <p className="font-mono font-medium">{bookingId.slice(0, 8).toUpperCase()}</p>
                        <div className="mt-4 space-y-2">
                            <p className="text-sm"><strong>Clinic:</strong> {selectedClinic?.name}</p>
                            <p className="text-sm"><strong>Doctor:</strong> {selectedDoctor?.name}</p>
                            <p className="text-sm"><strong>Date:</strong> {selectedDate}</p>
                            <p className="text-sm"><strong>Time:</strong> {selectedSlot?.start} - {selectedSlot?.end}</p>
                        </div>
                    </div>
                    <a href="/" className="btn-primary w-full">
                        Back to Home
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Appointment</h1>
                    <p className="text-gray-600">Follow the steps to schedule your visit</p>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center mb-10">
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${i < step ? 'bg-primary-600 text-white' :
                                    i === step ? 'bg-primary-100 text-primary-600 border-2 border-primary-600' :
                                        'bg-gray-100 text-gray-400'
                                    }`}
                            >
                                {i < step ? <Check className="w-5 h-5" /> : i + 1}
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`w-12 h-0.5 mx-1 ${i < step ? 'bg-primary-600' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Content Card */}
                <div className="card p-8 animate-in">
                    {/* Step 0: Select Clinic */}
                    {step === 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-6 flex items-center">
                                <Building2 className="w-6 h-6 mr-2 text-primary-600" />
                                Select Clinic
                            </h2>
                            {loading ? (
                                <div className="text-center py-10">Loading clinics...</div>
                            ) : (
                                <div className="space-y-3">
                                    {clinics.map((clinic) => (
                                        <button
                                            key={clinic.id}
                                            onClick={() => setSelectedClinic(clinic)}
                                            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${selectedClinic?.id === clinic.id
                                                ? 'border-primary-600 bg-primary-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <p className="font-medium">{clinic.name}</p>
                                            <p className="text-sm text-gray-500">{clinic.address}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 1: Select Specialist */}
                    {step === 1 && selectedClinic && (
                        <div>
                            <h2 className="text-xl font-semibold mb-6 flex items-center">
                                <User className="w-6 h-6 mr-2 text-primary-600" />
                                Select Specialist
                            </h2>
                            <div className="space-y-3">
                                {selectedClinic.specialists.map((spec) => (
                                    <button
                                        key={spec.id}
                                        onClick={() => setSelectedSpecialist(spec)}
                                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${selectedSpecialist?.id === spec.id
                                            ? 'border-primary-600 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <p className="font-medium">{spec.name}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Select Doctor */}
                    {step === 2 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-6 flex items-center">
                                <User className="w-6 h-6 mr-2 text-primary-600" />
                                Select Doctor
                            </h2>
                            {loading ? (
                                <div className="text-center py-10">Loading doctors...</div>
                            ) : doctors.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">No doctors available</div>
                            ) : (
                                <div className="space-y-3">
                                    {doctors.map((doctor) => (
                                        <button
                                            key={doctor.id}
                                            onClick={() => setSelectedDoctor(doctor)}
                                            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${selectedDoctor?.id === doctor.id
                                                ? 'border-primary-600 bg-primary-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <p className="font-medium">Dr. {doctor.name}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Select Date & Time */}
                    {step === 3 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-6 flex items-center">
                                <Calendar className="w-6 h-6 mr-2 text-primary-600" />
                                Select Date & Time
                            </h2>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                                <div className="flex flex-wrap gap-2">
                                    {getNextAvailableDates().map((date) => (
                                        <button
                                            key={date}
                                            onClick={() => setSelectedDate(date)}
                                            className={`px-4 py-2 rounded-lg text-sm transition-all ${selectedDate === date
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-gray-100 hover:bg-gray-200'
                                                }`}
                                        >
                                            {new Date(date).toLocaleDateString('en-IN', {
                                                weekday: 'short',
                                                day: 'numeric',
                                                month: 'short',
                                            })}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedDate && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        Available Slots
                                    </label>
                                    {loading ? (
                                        <div className="text-center py-6">Loading slots...</div>
                                    ) : slots.length === 0 ? (
                                        <div className="text-center py-6 text-gray-500">No slots available for this date</div>
                                    ) : (
                                        <div className="grid grid-cols-4 gap-2">
                                            {slots.map((slot) => (
                                                <button
                                                    key={slot.start}
                                                    onClick={() => slot.available && setSelectedSlot(slot)}
                                                    disabled={!slot.available}
                                                    className={`p-3 rounded-lg text-sm transition-all ${!slot.available
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : selectedSlot?.start === slot.start
                                                            ? 'bg-primary-600 text-white'
                                                            : 'bg-gray-100 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {slot.start}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Patient Details & Confirm */}
                    {step === 4 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-6">Patient Details & Confirm</h2>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        value={patientInfo.name}
                                        onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                                        className="input"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                    <input
                                        type="tel"
                                        value={patientInfo.phone}
                                        onChange={(e) => setPatientInfo({ ...patientInfo, phone: e.target.value })}
                                        className="input"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                                    <textarea
                                        value={patientInfo.notes}
                                        onChange={(e) => setPatientInfo({ ...patientInfo, notes: e.target.value })}
                                        className="input"
                                        rows={3}
                                        placeholder="Any specific concerns or requirements"
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <h3 className="font-medium mb-3">Booking Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <p><strong>Clinic:</strong> {selectedClinic?.name}</p>
                                    <p><strong>Specialist:</strong> {selectedSpecialist?.name}</p>
                                    <p><strong>Doctor:</strong> Dr. {selectedDoctor?.name}</p>
                                    <p><strong>Date:</strong> {selectedDate && new Date(selectedDate).toLocaleDateString('en-IN', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}</p>
                                    <p><strong>Time:</strong> {selectedSlot?.start} - {selectedSlot?.end}</p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 mb-4">
                                By confirming, you agree to receive WhatsApp messages for appointment updates.
                            </p>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8 pt-6 border-t">
                        <button
                            onClick={() => setStep(step - 1)}
                            disabled={step === 0}
                            className="btn-secondary flex items-center"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </button>

                        {step < 4 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                disabled={
                                    (step === 0 && !selectedClinic) ||
                                    (step === 1 && !selectedSpecialist) ||
                                    (step === 2 && !selectedDoctor) ||
                                    (step === 3 && !selectedSlot)
                                }
                                className="btn-primary flex items-center"
                            >
                                Continue
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </button>
                        ) : (
                            <button
                                onClick={handleBooking}
                                disabled={loading || !patientInfo.name || !patientInfo.phone}
                                className="btn-primary flex items-center"
                            >
                                {loading ? 'Booking...' : 'Confirm Booking'}
                                <Check className="w-4 h-4 ml-2" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
