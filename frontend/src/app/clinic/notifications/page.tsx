'use client'

import { Bell, Check, CheckCheck, Clock } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString()
}

function isUnread(status: string) {
    return status !== 'READ'
}

export default function NotificationsPage() {
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()

    return (
        <div className="max-w-3xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-500 mt-1">
                        Updates about appointments and clinic activity
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                        >
                            <CheckCheck className="w-4 h-4" />
                            Mark All Read
                        </button>
                    )}
                    <div className="bg-primary-50 text-primary-700 px-4 py-2 rounded-lg text-sm font-medium">
                        {unreadCount} Unread
                    </div>
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
                                    {notification.payload?.message || 'New Notification'}
                                </p>
                                <div className="mt-1 flex items-center text-sm text-gray-500">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {timeAgo(notification.createdAt)}
                                </div>
                            </div>
                            {isUnread(notification.status) && (
                                <button
                                    onClick={() => markAsRead(notification.id)}
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
