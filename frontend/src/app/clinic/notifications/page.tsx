'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Bell, Check, Clock } from 'lucide-react'

interface Notification {
    id: string
    title?: string // Not in payload currently, but maybe useful
    payload: {
        message: string
    }
    type: string
    status: string
    createdAt: string
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchNotifications()
    }, [])

    async function fetchNotifications() {
        setLoading(true)
        try {
            const res = await api.get<Notification[]>('/notifications')
            setNotifications(res)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handleMarkAsRead(id: string) {
        try {
            await api.patch(`/notifications/${id}/read`, {})
            // Update local state
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, status: 'READ' } : n)
            )
        } catch (error) {
            console.error('Failed to mark as read', error)
        }
    }

    function isUnread(status: string) {
        return status !== 'READ'
    }

    return (
        <div className="max-w-3xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-500 mt-1">
                        Updates about appointments and clinic activity
                    </p>
                </div>
                <div className="bg-primary-50 text-primary-700 px-4 py-2 rounded-lg text-sm font-medium">
                    {notifications.filter(n => isUnread(n.status)).length} Unread
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                    <div className="card p-8 text-center text-gray-500 flex flex-col items-center">
                        <Bell className="w-12 h-12 text-gray-300 mb-4" />
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`card p-4 flex items-start space-x-4 transition-colors ${isUnread(notification.status) ? 'bg-blue-50/50 border-blue-100' : 'bg-white'
                                }`}
                        >
                            <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center ${isUnread(notification.status) ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                <Bell className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <p className={`text-base text-gray-900 ${isUnread(notification.status) ? 'font-medium' : ''}`}>
                                    {notification.payload.message || 'New Notification'}
                                </p>
                                <div className="mt-1 flex items-center text-sm text-gray-500">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {new Date(notification.createdAt).toLocaleString()}
                                </div>
                            </div>
                            {isUnread(notification.status) && (
                                <button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="p-2 hover:bg-gray-200 rounded-full text-gray-500 tooltip"
                                    title="Mark as read"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
