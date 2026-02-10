'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Star, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react'

export default function FeedbackPage() {
    const params = useParams()
    const token = params?.token as string

    const [loading, setLoading] = useState(true)
    const [isValid, setIsValid] = useState(false)
    const [context, setContext] = useState<any>(null)
    const [error, setError] = useState('')
    const [submitted, setSubmitted] = useState(false)

    // Form State
    const [rating, setRating] = useState(0)
    const [comments, setComments] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (token) {
            validateToken()
        }
    }, [token])

    async function validateToken() {
        try {
            const res = await api.get<any>(`/feedback/validate/${token}`)
            setContext(res)
            setIsValid(true)
        } catch (err: any) {
            console.error(err)
            setError(err.response?.data?.message || 'Invalid or expired feedback link')
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (rating === 0) {
            alert('Please select a rating')
            return
        }

        setSubmitting(true)
        try {
            await api.post(`/feedback/submit/${token}`, {
                rating,
                comments
            })
            setSubmitted(true)
        } catch (err) {
            console.error(err)
            alert('Failed to submit feedback. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    if (!isValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        )
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center transform transition-all">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
                    <p className="text-gray-600">
                        Your feedback helps us improve our services.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-primary-600 px-6 py-8 text-center">
                    <h1 className="text-2xl font-bold text-white mb-1">Feedback</h1>
                    <p className="text-primary-100">
                        How was your visit with <br />
                        <span className="font-semibold text-white">Dr. {context?.doctorName}</span>?
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="text-center">
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                            Rate your experience
                        </label>
                        <div className="flex justify-center space-x-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`p-2 transition-transform hover:scale-110 focus:outline-none ${rating >= star ? 'text-yellow-400' : 'text-gray-300'
                                        }`}
                                >
                                    <Star className="w-8 h-8 fill-current" />
                                </button>
                            ))}
                        </div>
                        <div className="mt-2 text-sm text-gray-500 font-medium">
                            {rating === 1 && 'Poor'}
                            {rating === 2 && 'Fair'}
                            {rating === 3 && 'Good'}
                            {rating === 4 && 'Very Good'}
                            {rating === 5 && 'Excellent'}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Comments (Optional)
                        </label>
                        <div className="relative">
                            <textarea
                                rows={4}
                                className="input w-full pl-10 pt-3"
                                placeholder="Share your thoughts..."
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                            />
                            <MessageSquare className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full btn-primary py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                        {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>

                    <p className="text-xs text-center text-gray-400 mt-4">
                        Your feedback will be shared with the clinic administration.
                    </p>
                </form>
            </div>
        </div>
    )
}
