export interface User {
    id: string
    email: string
    role: 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR' | 'PATIENT'
    clinicId?: string
    isActive: boolean
}

export interface Clinic {
    id: string
    name: string
    address?: string
    phone?: string
    email?: string
    googleReviewUrl?: string
    isActive: boolean
}

export interface Specialist {
    id: string
    name: string
    description?: string
    clinicId: string
}

export interface Doctor {
    id: string
    name: string
    userId: string
    specialists: Specialist[]
}

export interface Patient {
    id: string
    name: string
    phone: string
    dob?: string
    gender?: 'MALE' | 'FEMALE' | 'OTHER'
    whatsappConsent: boolean
}

export interface Appointment {
    id: string
    clinicId: string
    patientId: string
    doctorId: string
    specialistId?: string
    appointmentDate: string
    startTime: string
    endTime: string
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
    notes?: string
    patient?: Patient
    doctor?: Doctor
    clinic?: Clinic
}

export interface TimeSlot {
    start: string
    end: string
    available: boolean
}

export interface Feedback {
    id: string
    appointmentId: string
    rating: number
    comments?: string
    isInternal: boolean
    submittedAt: string
}

export interface PaginatedResult<T> {
    items: T[]
    meta: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNextPage: boolean
        hasPreviousPage: boolean
    }
}
