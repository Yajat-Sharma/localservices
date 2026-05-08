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
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace("/login"); return; }
    fetchBookings();
  }, [user, isLoading]);

  const fetchBookings = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const res = await axios.get("/api/bookings", { headers: { Authorization: `Bearer ${token}` } });
      setBookings(res.data.bookings);
    } catch { toast.error("Failed to load bookings"); }
    finally { setLoading(false); }
  };

  const updateStatus = async (bookingId: string, status: string) => {
    setUpdatingId(bookingId);
    const token = localStorage.getItem("auth_token");
    try {
      await axios.patch(`/api/bookings/${bookingId}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Status updated");
      fetchBookings();
    } catch { toast.error("Failed to update status"); }
    finally { setUpdatingId(null); }
  };

  const activeBookings = bookings.filter(b => !["COMPLETED", "CANCELLED"].includes(b.status));
  const historyBookings = bookings.filter(b => ["COMPLETED", "CANCELLED"].includes(b.status));
  const displayed = activeTab === "active" ? activeBookings : historyBookings;

  const statusConfig: any = {
    PENDING:     { bg: "rgba(245,158,11,0.1)",  color: "#d97706", label: "Pending",     dot: "#f59e0b" },
    ACCEPTED:    { bg: "rgba(124,58,237,0.1)",  color: "#7c3aed", label: "Accepted",    dot: "#7c3aed" },
    IN_PROGRESS: { bg: "rgba(236,72,153,0.1)",  color: "#ec4899", label: "In Progress", dot: "#ec4899" },
    COMPLETED:   { bg: "rgba(16,185,129,0.1)",  color: "#059669", label: "Completed",   dot: "#10b981" },
    CANCELLED:   { bg: "rgba(239,68,68,0.1)",   color: "#dc2626", label: "Cancelled",   dot: "#ef4444" },
  };

  const isProvider = user?.role === "PROVIDER";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <TopNav showBack onBack={() => router.back()} title={t("bookings")} />

      {/* Stats strip */}
      {!loading && (
        <div className="px-4 py-3 flex gap-3 overflow-x-auto scrollbar-hide glass-nav">
          {[
            { label: "Active",    value: activeBookings.length,  color: "#7c3aed" },
            { label: "Completed", value: bookings.filter(b => b.status === "COMPLETED").length, color: "#059669" },
            { label: "Pending",   value: bookings.filter(b => b.status === "PENDING").length, color: "#d97706" },
            { label: "Total",     value: bookings.length,        color: "#ec4899" },
          ].map(s => (
            <div key={s.label} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl"
              style={{ background: `${s.color}12`, border: `1px solid ${s.color}25` }}>
              <span className="text-lg font-black" style={{ color: s.color }}>{s.value}</span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 pt-4 pb-2 flex gap-2">
        {(["active", "history"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all duration-200"
            style={activeTab === tab ? {
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              color: "white",
              boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
            } : {
              background: "var(--bg-subtle)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}>
            {tab === "active" ? `Active (${activeBookings.length})` : `History (${historyBookings.length})`}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3 pb-10 animate-fade-in">
        {/* Loading skeletons */}
        {loading && [1,2,3].map(i => (
          <div key={i} className="skeleton h-36 rounded-3xl" />
        ))}

        {/* Empty state */}
        {!loading && displayed.length === 0 && (
          <div className="card p-10 text-center mt-4">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.06))" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round"
                stroke="url(#grad1)">
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c3aed"/>
                    <stop offset="100%" stopColor="#ec4899"/>
                  </linearGradient>
                </defs>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <h3 className="font-black text-lg mb-2" style={{ color: "var(--text-primary)" }}>
              {activeTab === "active" ? "No active bookings" : "No history yet"}
            </h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              {activeTab === "active" ? "Book a service to get started!" : "Completed bookings appear here"}
            </p>
            {activeTab === "active" && (
              <button onClick={() => router.push("/hire")} className="btn-primary px-8 py-3">
                Find Services
              </button>
            )}
          </div>
        )}

        {/* Booking cards */}
        {!loading && displayed.map((booking: any) => {
          const st = statusConfig[booking.status] || statusConfig.PENDING;
          const isUpdating = updatingId === booking.id;

          return (
            <div key={booking.id} className="card p-0 overflow-hidden animate-fade-in">
              {/* Color accent bar */}
              <div className="h-1" style={{ background: `linear-gradient(90deg, ${st.dot}, ${st.dot}88)` }} />

              <div className="p-4">
                {/* Header row */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Category icon */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.06))" }}>
                    {booking.provider?.category?.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-black text-sm leading-tight truncate"
                          style={{ color: "var(--text-primary)" }}>
                          {isProvider ? booking.customer?.name || "Customer" : booking.provider?.businessName}
                        </h3>
                        <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {booking.provider?.category?.name}
                        </p>
                      </div>
                      {/* Status badge */}
                      <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ background: st.bg, color: st.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                        {st.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Problem */}
                <div className="px-3 py-2.5 rounded-2xl mb-3"
                  style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                  <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {booking.problem}
                  </p>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {/* Date */}
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(124,58,237,0.06)", color: "var(--text-muted)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>

                  {/* Scheduled date */}
                  {booking.scheduledDate && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {new Date(booking.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      {booking.scheduledTime && ` · ${booking.scheduledTime}`}
                    </span>
                  )}

                  {/* Price */}
                  {booking.price && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}>
                      ₹{booking.price}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Provider: PENDING */}
                  {isProvider && booking.status === "PENDING" && (
                    <>
                      <button onClick={() => updateStatus(booking.id, "ACCEPTED")} disabled={isUpdating}
                        className="flex-1 btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5">
                        {isUpdating ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                        Accept
                      </button>
                      <button onClick={() => updateStatus(booking.id, "CANCELLED")} disabled={isUpdating}
                        className="flex-1 text-xs py-2.5 rounded-2xl font-bold flex items-center justify-center gap-1.5 transition-all"
                        style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Decline
                      </button>
                    </>
                  )}

                  {/* Provider: ACCEPTED */}
                  {isProvider && booking.status === "ACCEPTED" && (
                    <button onClick={() => updateStatus(booking.id, "IN_PROGRESS")} disabled={isUpdating}
                      className="flex-1 btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5">
                      {isUpdating ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                      )}
                      Start Job
                    </button>
                  )}

                  {/* Provider: IN_PROGRESS */}
                  {isProvider && booking.status === "IN_PROGRESS" && (
                    <button onClick={() => updateStatus(booking.id, "COMPLETED")} disabled={isUpdating}
                      className="flex-1 btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5">
                      {isUpdating ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                      Mark Complete
                    </button>
                  )}

                  {/* Customer: cancel pending */}
                  {!isProvider && booking.status === "PENDING" && (
                    <button onClick={() => updateStatus(booking.id, "CANCELLED")} disabled={isUpdating}
                      className="flex-1 text-xs py-2.5 rounded-2xl font-bold transition-all"
                      style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>
                      Cancel Booking
                    </button>
                  )}

                  {/* Customer: rate completed */}
                  {!isProvider && booking.status === "COMPLETED" && !booking.review && (
                    <button onClick={() => router.push(`/provider/${booking.providerId}`)}
                      className="flex-1 text-xs py-2.5 rounded-2xl font-bold flex items-center justify-center gap-1.5 transition-all"
                      style={{ background: "rgba(245,158,11,0.08)", color: "#d97706", border: "1px solid rgba(245,158,11,0.2)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      Rate Experience
                    </button>
                  )}

                  {/* Chat button — always visible */}
                  <Link href={`/chat/${booking.id}`}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-95"
                    style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.08))", color: "var(--primary)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}