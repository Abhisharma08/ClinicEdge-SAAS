'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'

/* ─── SVG Icons (inline to avoid dependency issues) ─── */
function StarIcon({ filled, hovered }: { filled: boolean; hovered: boolean }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={`w-10 h-10 sm:w-12 sm:h-12 transition-all duration-200 ${hovered ? 'scale-125' : 'scale-100'
                }`}
            fill={filled ? '#FBBF24' : hovered ? '#FDE68A' : '#E5E7EB'}
            stroke={filled ? '#F59E0B' : '#D1D5DB'}
            strokeWidth="1"
        >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    )
}

function CheckCircleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function AlertIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    )
}

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    )
}

/* ─── Rating labels ─── */
const RATING_LABELS: Record<number, { text: string; emoji: string; color: string }> = {
    1: { text: 'Poor', emoji: '😞', color: 'text-red-500' },
    2: { text: 'Fair', emoji: '😐', color: 'text-orange-500' },
    3: { text: 'Good', emoji: '🙂', color: 'text-yellow-500' },
    4: { text: 'Very Good', emoji: '😊', color: 'text-emerald-500' },
    5: { text: 'Excellent', emoji: '🤩', color: 'text-teal-500' },
}

/* ─── Main Page Component ─── */
export default function FeedbackPage() {
    const params = useParams()
    const token = params?.token as string

    const [loading, setLoading] = useState(true)
    const [isValid, setIsValid] = useState(false)
    const [context, setContext] = useState<any>(null)
    const [error, setError] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [result, setResult] = useState<any>(null)

    // Form State
    const [rating, setRating] = useState(0)
    const [hoveredStar, setHoveredStar] = useState(0)
    const [comments, setComments] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState('')

    useEffect(() => {
        if (token) validateToken()
    }, [token])

    async function validateToken() {
        try {
            const res = await api.get<any>(`/feedback/validate/${token}`)
            setContext(res)
            setIsValid(true)
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Invalid or expired feedback link'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setFormError('')

        if (rating === 0) {
            setFormError('Please select a rating to continue')
            return
        }

        setSubmitting(true)
        try {
            const res = await api.post<any>(`/feedback/submit/${token}`, {
                rating,
                comments: comments.trim() || undefined,
            })
            setResult(res)
            setSubmitted(true)
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to submit feedback. Please try again.'
            setFormError(msg)
        } finally {
            setSubmitting(false)
        }
    }

    const activeRating = hoveredStar || rating

    /* ─── Loading State ─── */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F0FDFA 0%, #E0F2FE 100%)' }}>
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4" />
                    <p style={{ color: '#6B7280', fontSize: '14px' }}>Loading your feedback form...</p>
                </div>
            </div>
        )
    }

    /* ─── Invalid / Expired Token ─── */
    if (!isValid) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF7ED 100%)' }}>
                <div style={{
                    maxWidth: '420px', width: '100%', background: 'white',
                    borderRadius: '20px', padding: '48px 32px', textAlign: 'center',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
                }}>
                    <AlertIcon />
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937', margin: '16px 0 8px' }}>
                        {error.includes('expired') ? 'Link Expired' : error.includes('already') ? 'Already Submitted' : 'Invalid Link'}
                    </h2>
                    <p style={{ color: '#6B7280', fontSize: '15px', lineHeight: 1.6 }}>{error}</p>
                    <div style={{
                        marginTop: '24px', padding: '12px 16px', background: '#FEF2F2',
                        borderRadius: '10px', fontSize: '13px', color: '#991B1B',
                    }}>
                        If you believe this is an error, please contact the clinic directly.
                    </div>
                </div>
            </div>
        )
    }

    /* ─── Success State ─── */
    if (submitted) {
        const redirectToGoogle = result?.redirectToGoogle
        const googleUrl = result?.googleReviewUrl

        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #F0FDFA 0%, #ECFDF5 100%)' }}>
                <div style={{
                    maxWidth: '480px', width: '100%', background: 'white',
                    borderRadius: '20px', overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                        padding: '32px', textAlign: 'center',
                    }}>
                        <div style={{
                            display: 'inline-flex', width: '64px', height: '64px',
                            borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <CheckCircleIcon />
                        </div>
                    </div>

                    <div style={{ padding: '32px', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#1F2937', margin: '0 0 8px' }}>
                            Thank You! 🎉
                        </h2>
                        <p style={{ color: '#6B7280', fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px' }}>
                            {result?.message || 'Your feedback helps us improve our services.'}
                        </p>

                        {/* Star display */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '24px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} viewBox="0 0 24 24" style={{ width: '28px', height: '28px' }}
                                    fill={rating >= star ? '#FBBF24' : '#E5E7EB'} stroke={rating >= star ? '#F59E0B' : '#D1D5DB'} strokeWidth="1">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            ))}
                        </div>

                        {/* Google Review redirect */}
                        {redirectToGoogle && googleUrl && (
                            <div style={{
                                background: '#F0FDF4', border: '1px solid #BBF7D0',
                                borderRadius: '12px', padding: '20px', marginBottom: '16px',
                            }}>
                                <p style={{ color: '#166534', fontSize: '14px', fontWeight: 600, margin: '0 0 12px' }}>
                                    Would you like to share your experience on Google too?
                                </p>
                                <a href={googleUrl} target="_blank" rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center',
                                        background: 'white', color: '#1F2937',
                                        padding: '12px 24px', borderRadius: '8px',
                                        fontWeight: 600, fontSize: '14px',
                                        textDecoration: 'none', border: '1px solid #D1D5DB',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                        transition: 'box-shadow 0.2s',
                                    }}
                                >
                                    <GoogleIcon />
                                    Leave a Google Review
                                </a>
                            </div>
                        )}

                        <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '16px' }}>
                            You can close this page now.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    /* ─── Main Feedback Form ─── */
    return (
        <div className="min-h-screen py-8 px-4" style={{ background: 'linear-gradient(135deg, #F0FDFA 0%, #E0F2FE 100%)' }}>
            <div style={{
                maxWidth: '480px', margin: '0 auto', background: 'white',
                borderRadius: '20px', overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                    padding: '32px 24px', textAlign: 'center',
                }}>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 4px' }}>
                        ClinicEdge
                    </p>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white', margin: '0 0 8px' }}>
                        Share Your Feedback
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', margin: 0 }}>
                        How was your visit with <strong>Dr. {context?.doctorName}</strong>?
                    </p>
                    {context?.clinicName && (
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '4px 0 0' }}>
                            at {context.clinicName}
                        </p>
                    )}
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} style={{ padding: '32px 24px' }}>
                    {/* Star Rating */}
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>
                            Rate your experience
                        </label>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredStar(star)}
                                    onMouseLeave={() => setHoveredStar(0)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        padding: '4px', transition: 'transform 0.15s',
                                    }}
                                    aria-label={`Rate ${star} stars`}
                                >
                                    <StarIcon filled={star <= (hoveredStar || rating)} hovered={star === hoveredStar} />
                                </button>
                            ))}
                        </div>

                        {/* Rating label */}
                        <div style={{ minHeight: '32px', marginTop: '8px' }}>
                            {activeRating > 0 && RATING_LABELS[activeRating] && (
                                <span style={{ fontSize: '15px', fontWeight: 600 }}
                                    className={RATING_LABELS[activeRating].color}>
                                    {RATING_LABELS[activeRating].emoji} {RATING_LABELS[activeRating].text}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Comments */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block', fontSize: '14px', fontWeight: 600,
                            color: '#374151', marginBottom: '8px',
                        }}>
                            Additional Comments <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(Optional)</span>
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Tell us about your experience..."
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            maxLength={1000}
                            style={{
                                width: '100%', padding: '14px 16px',
                                borderRadius: '12px', border: '1px solid #E5E7EB',
                                fontSize: '14px', color: '#1F2937', lineHeight: 1.6,
                                resize: 'vertical', outline: 'none',
                                transition: 'border-color 0.2s, box-shadow 0.2s',
                                boxSizing: 'border-box',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#0D9488'
                                e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.1)'
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#E5E7EB'
                                e.target.style.boxShadow = 'none'
                            }}
                        />
                        <p style={{ textAlign: 'right', fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                            {comments.length}/1000
                        </p>
                    </div>

                    {/* Error message */}
                    {formError && (
                        <div style={{
                            background: '#FEF2F2', border: '1px solid #FECACA',
                            borderRadius: '10px', padding: '12px 16px',
                            color: '#991B1B', fontSize: '13px', marginBottom: '16px',
                            display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                            ⚠️ {formError}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            width: '100%', padding: '16px',
                            background: submitting ? '#9CA3AF' : 'linear-gradient(135deg, #0D9488, #0F766E)',
                            color: 'white', border: 'none', borderRadius: '12px',
                            fontSize: '16px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                            boxShadow: submitting ? 'none' : '0 4px 14px rgba(13,148,136,0.3)',
                            transition: 'all 0.2s',
                            letterSpacing: '0.3px',
                        }}
                    >
                        {submitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Submitting...
                            </span>
                        ) : (
                            'Submit Feedback'
                        )}
                    </button>

                    {/* Footer note */}
                    <p style={{
                        textAlign: 'center', fontSize: '12px', color: '#9CA3AF',
                        marginTop: '16px', lineHeight: 1.6,
                    }}>
                        🔒 Your feedback is confidential and helps us improve our services.
                    </p>
                </form>
            </div>
        </div>
    )
}
