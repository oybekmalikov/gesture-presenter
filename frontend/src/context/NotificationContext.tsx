import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { notificationsApi } from '../services/api';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  meta?: any;
  createdAt: string;
}

interface NotificationContextType {
  unreadCount: number;
  notifications: NotificationItem[];
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchUnread = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationsApi.getUnreadCount();
      setUnreadCount(res.unreadCount || 0);
    } catch {}
  };

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationsApi.getAll(1, 15);
      if (res?.items) {
        setNotifications(res.items);
      }
      await fetchUnread();
    } catch {}
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    fetchNotifications();

    const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5050';
    let socket: Socket | null = null;

    try {
      socket = io(`${socketUrl}/notifications`, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
      });

      socket.on('connect', () => {
        socket?.emit('authenticate', { userId: user.id });
      });

      socket.on('notification_received', (newNotif: NotificationItem) => {
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      socket.on('system_announcement', (announcement: any) => {
        setNotifications((prev) => [
          {
            id: `ann_${Date.now()}`,
            type: 'system',
            title: 'Tizim e`loni',
            message: announcement.message || String(announcement),
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setUnreadCount((prev) => prev + 1);
      });
    } catch {}

    const interval = setInterval(fetchUnread, 45000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, user?.id]);

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider',
    );
  }
  return context;
};
