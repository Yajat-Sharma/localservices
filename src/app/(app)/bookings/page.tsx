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
  const [activeTab, setActiveTab] = useState<"active"|"history">("active");

  useEffect(() => { if (!user) { router.replace("/login"); return; } fetchBookings(); }, [user]);

  const fetchBookings = async () => {
    const token = localStorage.getItem("auth_token");
    try { const res = await axios.get("/api/bookings", { headers: { Authorization: `Bearer ${token}` } }); setBookings(res.data.bookings); }
    catch { toast.error("Failed to load bookings"); }
    finally { setLoading(false); }
  };

  const updateStatus = async (bookingId: string, status: string) => {
    const token = localStorage.getItem("auth_token");
    try { await axios.patch(`/api/bookings/${bookingId}`, { status }, { headers: { Authorization: `Bearer ${token}` } }); toast.success("Status updated"); fetchBookings(); }
    catch { toast.error("Failed to update status"); }
  };

  const activeBookings = bookings.filter(b => !["COMPLETED","CANCELLED"].includes(b.status));
  const historyBookings = bookings.filter(b => ["COMPLETED","CANCELLED"].includes(b.status));
  const displayed = activeTab === "active" ? activeBookings : historyBookings;
  const statusColors: any = { PENDING:"tag-orange", ACCEPTED:"tag-blue", IN_PROGRESS:"tag-blue", COMPLETED:"tag-green", CANCELLED:"tag-red" };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav showBack onBack={() => router.back()} title={t("bookings")} />
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex gap-2">
        {(["active","history"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab ? "bg-blue-500 text-white" : "text-gray-500"}`}>
            {tab === "active" ? `Active (${activeBookings.length})` : `History (${historyBookings.length})`}
          </button>
        ))}
      </div>
      <div className="p-4 space-y-3">
        {loading ? [1,2,3].map(i => <div key={i} className="card h-28 skeleton" />) : displayed.length === 0 ? (
          <div className="text-center py-16"><div className="text-5xl mb-3">📋</div><p className="font-semibold text-gray-700">{t("no_history")}</p></div>
        ) : displayed.map((booking: any) => (
          <div key={booking.id} className="card p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2"><span className="text-lg">{booking.provider?.category?.icon}</span><h3 className="font-bold text-gray-900 text-sm">{user?.role === "PROVIDER" ? booking.customer?.name : booking.provider?.businessName}</h3></div>
                <p className="text-xs text-gray-500 mt-0.5 ml-7">{booking.provider?.category?.name}</p>
              </div>
              <span className={`tag ${statusColors[booking.status] || "tag-orange"}`}>{booking.status}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-3"><p className="text-sm text-gray-800 line-clamp-2">{booking.problem}</p></div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{new Date(booking.createdAt).toLocaleDateString("en-IN")}</span>
              <div className="flex gap-2">
                {user?.role === "PROVIDER" && booking.status === "PENDING" && (
                  <><button onClick={() => updateStatus(booking.id, "ACCEPTED")} className="text-xs btn-primary px-3 py-1.5">Accept</button>
                  <button onClick={() => updateStatus(booking.id, "CANCELLED")} className="text-xs btn-secondary px-3 py-1.5">Decline</button></>
                )}
                {user?.role === "PROVIDER" && booking.status === "ACCEPTED" && <button onClick={() => updateStatus(booking.id, "IN_PROGRESS")} className="text-xs btn-primary px-3 py-1.5">Start</button>}
                {user?.role === "PROVIDER" && booking.status === "IN_PROGRESS" && <button onClick={() => updateStatus(booking.id, "COMPLETED")} className="text-xs btn-primary px-3 py-1.5">Complete</button>}
                <Link href={`/chat/${booking.providerId}`} className="text-xs btn-ghost px-3 py-1.5">💬</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
