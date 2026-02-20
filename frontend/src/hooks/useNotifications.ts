import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

export interface Notification {
    id: string;
    type: string;
    channel: string;
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';
    payload: any;
    createdAt: string;
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    const fetchNotifications = async () => {
        try {
            const res = await api.get<Notification[]>('/notifications');
            setNotifications(res);
            setUnreadCount(res.filter(n => n.status !== 'READ').length);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchNotifications();

        // Smart polling: only poll when tab is visible
        const startPolling = () => {
            if (!pollInterval.current) {
                pollInterval.current = setInterval(fetchNotifications, 30000); // 30s
            }
        };

        const stopPolling = () => {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
                pollInterval.current = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopPolling();
            } else {
                fetchNotifications(); // Fetch immediately when coming back
                startPolling();
            }
        };

        // Start polling by default if visible
        if (!document.hidden) {
            startPolling();
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            stopPolling();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`, {});
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, status: 'READ' } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => n.status !== 'READ');
        if (unreadIds.length === 0) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' as const })));
        setUnreadCount(0);

        try {
            await api.patch('/notifications/read-all', {});
        } catch (error) {
            console.error('Failed to mark all as read', error);
            // Revert on failure
            fetchNotifications();
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead
    };
}
