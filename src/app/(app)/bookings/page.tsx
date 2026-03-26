"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopNav } from "@/components/shared/TopNav";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";
import axios from "axios";
import toast from "react-hot-toast";

export default function BookingsPage() {
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const res = await axios.get("/api/bookings", { headers: { Authorization: `Bearer ${token}` } });
      setBookings(res.data.bookings);
    } catch { toast.error("Failed to load bookings"); }
    finally { setLoading(false); }
  };

  const updateStatus = async (bookingId: string, status: string) => {
    const token = localStorage.getItem("auth_token");
    try {
      await axios.patch(`/api/bookings/${bookingId}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Status updated");
      fetchBookings();
    } catch { toast.error("Failed to update status"); }
  };

  const activeBookings = bookings.filter(b => !["COMPLETED", "CANCELLED"].includes(b.status));
  const historyBookings = bookings.filter(b => ["COMPLETED", "CANCELLED"].includes(b.status));
  const displayed = activeTab === "active" ? activeBookings : historyBookings;

  const statusConfig: any = {
    PENDING: { class: "tag-orange", label: "Pending", icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    )},
    ACCEPTED: { class: "tag-blue", label: "Accepted", icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    )},
    IN_PROGRESS: { class: "tag-blue", label: "In Progress", icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    )},
    COMPLETED: { class: "tag-green", label: "Completed", icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    )},
    CANCELLED: { class: "tag-red", label: "Cancelled", icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    )},
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <TopNav showBack onBack={() => router.back()} title={t("bookings")} />

      {/* Tabs */}
      <div className="glass-nav px-4 py-3 flex gap-2">
        {(["active", "history"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === tab
                ? "bg-blue-500 text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab === "active" ? `Active (${activeBookings.length})` : `History (${historyBookings.length})`}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3 pb-8 animate-fade-in">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="card h-32 skeleton" />)
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 card p-8">
            <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <p className="font-bold text-gray-700 dark:text-gray-200">
              {activeTab === "active" ? "No active bookings" : "No booking history"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {activeTab === "active" ? "Book a service to get started!" : "Completed bookings will appear here"}
            </p>
            {activeTab === "active" && (
              <button
                onClick={() => router.push("/hire")}
                className="btn-primary mt-4 text-sm px-6 py-2.5"
              >
                Find Services
              </button>
            )}
          </div>
        ) : (
          displayed.map((booking: any) => {
            const status = statusConfig[booking.status] || statusConfig.PENDING;
            const isProvider = user?.role === "PROVIDER";

            return (
              <div key={booking.id} className="card p-4 animate-fade-in">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.1), rgba(79,70,229,0.1))" }}>
                      <span className="text-xl">{booking.provider?.category?.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate">
                        {isProvider ? booking.customer?.name || "Customer" : booking.provider?.businessName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {booking.provider?.category?.name}
                      </p>
                    </div>
                  </div>
                  <span className={`tag ${status.class} flex items-center gap-1 flex-shrink-0`}>
                    {status.icon}
                    {status.label}
                  </span>
                </div>

                {/* Problem description */}
                <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-3 mb-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                    {booking.problem}
                  </p>
                </div>

                {/* Scheduled date/time */}
                {booking.scheduledDate && (
                  <div className="flex items-center gap-1.5 mb-3 px-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      Scheduled: {new Date(booking.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {booking.scheduledTime && ` at ${booking.scheduledTime}`}
                    </span>
                  </div>
                )}

                {/* Price if set */}
                {booking.price && (
                  <div className="flex items-center gap-1.5 mb-3 px-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      ₹{booking.price}
                    </span>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Provider actions */}
                    {isProvider && booking.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => updateStatus(booking.id, "ACCEPTED")}
                          className="text-xs btn-primary px-3 py-1.5 flex items-center gap-1"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Accept
                        </button>
                        <button
                          onClick={() => updateStatus(booking.id, "CANCELLED")}
                          className="text-xs px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold flex items-center gap-1"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                          Decline
                        </button>
                      </>
                    )}
                    {isProvider && booking.status === "ACCEPTED" && (
                      <button
                        onClick={() => updateStatus(booking.id, "IN_PROGRESS")}
                        className="text-xs btn-primary px-3 py-1.5 flex items-center gap-1"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        Start
                      </button>
                    )}
                    {isProvider && booking.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => updateStatus(booking.id, "COMPLETED")}
                        className="text-xs btn-primary px-3 py-1.5 flex items-center gap-1"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Complete
                      </button>
                    )}

                    {/* Customer cancel */}
                    {!isProvider && booking.status === "PENDING" && (
                      <button
                        onClick={() => updateStatus(booking.id, "CANCELLED")}
                        className="text-xs px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 font-semibold"
                      >
                        Cancel
                      </button>
                    )}

                    {/* Rate button for completed */}
                    {!isProvider && booking.status === "COMPLETED" && !booking.review && (
                      <button
                        onClick={() => router.push(`/provider/${booking.providerId}`)}
                        className="text-xs px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 font-semibold flex items-center gap-1"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        Rate
                      </button>
                    )}

                    {/* Chat button */}
                    <Link
                      href={`/chat/${booking.providerId}`}
                      className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}