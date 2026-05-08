"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  ACCEPTED: "#7c3aed",
  IN_PROGRESS: "#ec4899",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function ProviderDashboardPage() {
  const { t } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "bookings">("overview");

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "PROVIDER") { router.replace("/hire"); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const res = await axios.get("/api/bookings", { headers: { Authorization: `Bearer ${token}` } });
      setBookings(res.data.bookings);
    } catch { toast.error("Failed to load dashboard"); }
    finally { setLoading(false); }
  };

  const updateStatus = async (bookingId: string, status: string) => {
    const token = localStorage.getItem("auth_token");
    try {
      await axios.patch(`/api/bookings/${bookingId}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Status updated");
      fetchData();
    } catch { toast.error("Failed to update status"); }
  };

  const provider = user?.provider as any;
  const completed = bookings.filter(b => b.status === "COMPLETED");
  const pending = bookings.filter(b => b.status === "PENDING");
  const active = bookings.filter(b => !["COMPLETED", "CANCELLED"].includes(b.status));
  const totalEarned = completed.reduce((sum, b) => sum + (b.price || 0), 0);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // Last 7 days bookings chart
  const last7 = isMounted ? Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("en-IN", { weekday: "short" });
    const count = bookings.filter(b => {
      const bd = new Date(b.createdAt);
      return bd.toDateString() === d.toDateString();
    }).length;
    return { label, count };
  }) : [];

  const statusBreakdown = Object.entries(
    bookings.reduce((acc: any, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ status, count, label: STATUS_LABELS[status] || status }));

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <TopNav title="My Dashboard" />

      {/* Tab bar */}
      <div className="glass-nav px-4 py-3 flex gap-2">
        {(["overview", "bookings"] as const).map(t_ => (
          <button
            key={t_}
            onClick={() => setTab(t_)}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-200"
            style={tab === t_ ? {
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              color: "white",
              boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
            } : {
              color: "var(--text-muted)",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
            }}
          >
            {t_ === "overview" ? "Overview" : `My Bookings (${active.length})`}
          </button>
        ))}
      </div>

      <div className="p-4 pb-24 space-y-4 animate-fade-in">

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <>
            {/* Provider profile card */}
            <div className="card p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-10"
                style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }} />
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.06))" }}>
                  {provider?.category?.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-black text-lg" style={{ color: "var(--text-primary)" }}>
                      {provider?.businessName}
                    </h2>
                    {provider?.isVerified && (
                      <span className="verified-badge flex items-center gap-0.5 text-[10px]">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{provider?.category?.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={provider?.isApproved
                        ? { background: "rgba(16,185,129,0.1)", color: "#059669" }
                        : { background: "rgba(245,158,11,0.1)", color: "#d97706" }}>
                      {provider?.isApproved ? "✓ Approved" : "⏳ Pending Approval"}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={provider?.isAvailable
                        ? { background: "rgba(16,185,129,0.1)", color: "#059669" }
                        : { background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
                      {provider?.isAvailable ? "🟢 Available" : "🔴 Unavailable"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Total Earned",
                  value: `₹${totalEarned.toLocaleString("en-IN")}`,
                  color: "#10b981",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  ),
                },
                {
                  label: "Total Jobs",
                  value: bookings.length,
                  color: "#7c3aed",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                  ),
                },
                {
                  label: "Completed",
                  value: completed.length,
                  color: "#059669",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ),
                },
                {
                  label: "Pending",
                  value: pending.length,
                  color: "#d97706",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  ),
                },
              ].map(stat => (
                <div key={stat.label} className="card p-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 rounded-bl-2xl opacity-10"
                    style={{ background: stat.color }} />
                  <div className="mb-2 opacity-70" style={{ color: stat.color }}>{stat.icon}</div>
                  <div className="text-2xl font-black" style={{ color: stat.color }}>
                    {loading ? "—" : stat.value}
                  </div>
                  <div className="text-xs font-semibold mt-1" style={{ color: "var(--text-muted)" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Rating card */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-base" style={{ color: "var(--text-primary)" }}>Your Performance</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-2xl" style={{ background: "rgba(245,158,11,0.08)" }}>
                  <p className="text-2xl font-black" style={{ color: "#d97706" }}>
                    {provider?.avgRating?.toFixed(1) || "0.0"}
                  </p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--text-muted)" }}>Avg Rating</p>
                  <div className="flex justify-center gap-0.5 mt-1">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} width="10" height="10" viewBox="0 0 24 24"
                        fill={(provider?.avgRating || 0) >= s ? "#f59e0b" : "none"}
                        stroke="#f59e0b" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    ))}
                  </div>
                </div>
                <div className="text-center p-3 rounded-2xl" style={{ background: "rgba(124,58,237,0.08)" }}>
                  <p className="text-2xl font-black" style={{ color: "#7c3aed" }}>{provider?.totalReviews || 0}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--text-muted)" }}>Reviews</p>
                </div>
                <div className="text-center p-3 rounded-2xl" style={{ background: "rgba(16,185,129,0.08)" }}>
                  <p className="text-2xl font-black" style={{ color: "#059669" }}>
                    {bookings.length > 0 ? `${Math.round((completed.length / bookings.length) * 100)}%` : "0%"}
                  </p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--text-muted)" }}>Completion</p>
                </div>
              </div>
            </div>

            {/* Bookings trend */}
            <div className="card p-4">
              <h3 className="font-black text-base mb-4" style={{ color: "var(--text-primary)" }}>Bookings This Week</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={last7} barSize={28}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px" }}
                    labelStyle={{ color: "var(--text-primary)", fontWeight: 700 }}
                    cursor={{ fill: "rgba(124,58,237,0.06)" }}
                  />
                  <Bar dataKey="count" name="Bookings" radius={[8, 8, 0, 0]}>
                    {last7.map((_, i) => <Cell key={i} fill={i === 6 ? "#7c3aed" : "#7c3aed55"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status breakdown */}
            {statusBreakdown.length > 0 && (
              <div className="card p-4">
                <h3 className="font-black text-base mb-3" style={{ color: "var(--text-primary)" }}>Status Breakdown</h3>
                <div className="space-y-2.5">
                  {statusBreakdown.map(({ status, count, label }) => {
                    const color = STATUS_COLORS[status] || "#94a3b8";
                    const pct = bookings.length > 0 ? Math.round((count as number / bookings.length) * 100) : 0;
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{pct}%</span>
                            <span className="text-sm font-black" style={{ color }}>{count as number}</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: "var(--bg-subtle)" }}>
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Edit Profile", href: "/provide/edit", icon: "✏️" },
                { label: "Upload Documents", href: "/provide/documents", icon: "📄" },
                { label: "Portfolio", href: "/provide/portfolio", icon: "📸" },
                { label: "Earnings", href: "/provide/earnings", icon: "💰" },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="card p-4 flex items-center gap-3 hover:shadow-md transition-all active:scale-95"
                >
                  <span className="text-2xl">{link.icon}</span>
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{link.label}</span>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* ── BOOKINGS TAB ── */}
        {tab === "bookings" && (
          <div className="space-y-3">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="skeleton h-36 rounded-3xl" />)
            ) : bookings.length === 0 ? (
              <div className="card p-10 text-center">
                <div className="text-5xl mb-3">📋</div>
                <h3 className="font-black text-lg mb-2" style={{ color: "var(--text-primary)" }}>No bookings yet</h3>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Bookings from customers will appear here</p>
              </div>
            ) : (
              bookings.map((booking: any) => {
                const color = STATUS_COLORS[booking.status] || "#94a3b8";
                const label = STATUS_LABELS[booking.status] || booking.status;
                return (
                  <div key={booking.id} className="card p-0 overflow-hidden">
                    <div className="h-1" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
                          {booking.customer?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-black text-sm" style={{ color: "var(--text-primary)" }}>
                                {booking.customer?.name || "Customer"}
                              </p>
                              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                {booking.customer?.phone}
                              </p>
                            </div>
                            <span className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
                              style={{ background: `${color}18`, color }}>
                              {label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-2.5 rounded-2xl mb-3"
                        style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                        <p className="text-sm line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                          {booking.problem}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {booking.scheduledDate && (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}>
                            📅 {new Date(booking.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            {booking.scheduledTime && ` · ${booking.scheduledTime}`}
                          </span>
                        )}
                        {booking.price && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}>
                            ₹{booking.price}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {booking.status === "PENDING" && (
                          <>
                            <button onClick={() => updateStatus(booking.id, "ACCEPTED")}
                              className="flex-1 btn-primary text-xs py-2.5">Accept</button>
                            <button onClick={() => updateStatus(booking.id, "CANCELLED")}
                              className="flex-1 text-xs py-2.5 rounded-2xl font-bold"
                              style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>
                              Decline
                            </button>
                          </>
                        )}
                        {booking.status === "ACCEPTED" && (
                          <button onClick={() => updateStatus(booking.id, "IN_PROGRESS")}
                            className="flex-1 btn-primary text-xs py-2.5">Start Job</button>
                        )}
                        {booking.status === "IN_PROGRESS" && (
                          <button onClick={() => updateStatus(booking.id, "COMPLETED")}
                            className="flex-1 btn-primary text-xs py-2.5">Mark Complete</button>
                        )}
                        <Link href={`/chat/${booking.id}`}
                          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
                          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.08))", color: "var(--primary)" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
        )}
      </div>
    </div>
  );
}