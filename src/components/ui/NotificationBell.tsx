"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import axios from "axios";

export function NotificationBell() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Play sound when new notification arrives
  useEffect(() => {
    if (unreadCount > prevCountRef.current && prevCountRef.current > 0) {
      playSound();
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  const playSound = () => {
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgmsKwjGI2OWScw7KNYjc6Zp3EtI5jODtnnMSzjWM5PGmexLSOZDo9ap/FtY9lOz9sn8W2kGY8QG6gxreRZz1Bb6HHuJJoP0JxosiykmhBQ3OjybSUaUJEdKTKtZVqQ0V2pc22lmtERnemy7iXbEVIeKfMuZhtRkp6qM27mm5HS3yrzsCanE5Nfq3Qzp6fT1CBr9LQop9QUoOy1dKkn1FThLTW06efUlSGttjUqKBTVYi42daroFRWirrbFq6hVleNvN0Xr6JYWo+/3xixo1pcksHeGbGkXF2Vwt8csaVeX5jE4B2ypWBimMXhHrSmYWObye8ftadiY5zI8CC2p2VlncrxIranZmaeyPIitqhmZ5/M8yO3qGlpoc3zJLipamqkz/Qlt6traKX");
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    try {
      const res = await axios.get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch {}
  };

  const markAllRead = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      await axios.post("/api/notifications/read", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleNotificationClick = async (notification: any) => {
    const token = localStorage.getItem("auth_token");
    try {
      await axios.post("/api/notifications/read",
        { notificationId: notification.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => prev.map(n =>
        n.id === notification.id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
    if (notification.link) {
      router.push(notification.link);
    }
    setIsOpen(false);
  };

  const clearAll = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      await axios.delete("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch {}
  };

  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      booking: "📋", success: "✅", error: "❌",
      warning: "⚠️", message: "💬", info: "🔔",
    };
    return icons[type] || "🔔";
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen && unreadCount > 0) markAllRead(); }}
        className="relative w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 w-80 bg-white rounded-3xl shadow-elevated border border-gray-100 z-50 overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Notifications</h3>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-600 font-medium">
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🔔</div>
                  <p className="text-sm text-gray-500">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${!notification.isRead ? "bg-blue-50/50" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0 mt-0.5">{getIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold leading-tight ${!notification.isRead ? "text-gray-900" : "text-gray-600"}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{getTimeAgo(notification.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}