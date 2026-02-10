'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Star, Filter } from 'lucide-react'

export default function FeedbackPage() {
    const [feedback, setFeedback] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchFeedback()
    }, [])

    async function fetchFeedback() {
        setLoading(true)
        try {
            const res = await api.get<any>('/feedback')
            setFeedback(res.items)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Patient Feedback</h1>

            <div className="card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-6 py-3 font-medium">Patient</th>
                                <th className="px-6 py-3 font-medium">Rating</th>
                                <th className="px-6 py-3 font-medium">Comments</th>
                                <th className="px-6 py-3 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : feedback.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                        No feedback found
                                    </td>
                                </tr>
                            ) : (
                                feedback.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {item.appointment?.patient?.name || 'Anonymous'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-yellow-400">
                                                <span className="font-medium text-gray-900 mr-2">{item.rating}</span>
                                                <Star className="w-4 h-4 fill-current" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 max-w-md truncate">
                                            {item.comments || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
