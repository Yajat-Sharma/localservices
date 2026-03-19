"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";
import axios from "axios";
import toast from "react-hot-toast";

export default function ProviderDashboard() {
  const { t } = useLanguage();
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    if (!user.provider) { router.replace("/provide/register"); return; }
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    const token = localStorage.getItem("auth_token");
    try { const res = await axios.get("/api/bookings", { headers: { Authorization: `Bearer ${token}` } }); setBookings(res.data.bookings); }
    catch {} finally { setLoading(false); }
  };

  const toggleAvailability = async () => {
    if (!user?.provider) return;
    setTogglingAvail(true);
    const token = localStorage.getItem("auth_token");
    try {
      const res = await axios.patch("/api/providers/me", { isAvailable: !user.provider.isAvailable }, { headers: { Authorization: `Bearer ${token}` } });
      setUser({ ...user, provider: { ...user.provider, isAvailable: res.data.provider.isAvailable } } as any);
      toast.success(`You are now ${res.data.provider.isAvailable ? "available" : "unavailable"}`);
    } catch { toast.error("Failed to update"); }
    finally { setTogglingAvail(false); }
  };

  const provider = user?.provider;
  const pendingCount = bookings.filter(b => b.status === "PENDING").length;
  const completedCount = bookings.filter(b => b.status === "COMPLETED").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav title="My Dashboard" />
      <div className="p-4 space-y-4 pb-8">
        <div className="card p-5">
          {!provider?.isApproved && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl mb-4">
              <span className="text-xl">⏳</span>
              <div><p className="font-semibold text-amber-800 text-sm">Pending Approval</p><p className="text-xs text-amber-600">Admin is reviewing your profile</p></div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{provider?.businessName}</h2>
              <p className="text-sm text-gray-500">{(provider as any)?.category?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Availability</p>
              <button onClick={toggleAvailability} disabled={togglingAvail} className={`relative w-14 h-7 rounded-full transition-colors ${provider?.isAvailable ? "bg-emerald-500" : "bg-gray-300"}`}>
                <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${provider?.isAvailable ? "translate-x-7" : ""}`} />
              </button>
              <p className={`text-xs mt-1 font-medium ${provider?.isAvailable ? "text-emerald-600" : "text-gray-400"}`}>{provider?.isAvailable ? t("available") : t("unavailable")}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[{label:"Pending",value:pendingCount,color:"bg-amber-50 text-amber-700",icon:"⏳"},{label:"Completed",value:completedCount,color:"bg-emerald-50 text-emerald-700",icon:"✅"},{label:"Total",value:bookings.length,color:"bg-blue-50 text-blue-700",icon:"📋"}].map(stat => (
            <div key={stat.label} className={`card p-3 text-center ${stat.color}`}><div className="text-xl mb-1">{stat.icon}</div><div className="text-2xl font-bold">{stat.value}</div><div className="text-xs font-medium">{stat.label}</div></div>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between mb-3"><h3 className="section-title">Recent Bookings</h3><button onClick={() => router.push("/bookings")} className="text-xs text-blue-600">View All</button></div>
          {loading ? [1,2].map(i => <div key={i} className="card h-20 skeleton mb-3" />) : bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-400"><div className="text-4xl mb-2">📭</div><p className="text-sm">No bookings yet</p></div>
          ) : (
            <div className="space-y-3">{bookings.slice(0,5).map(booking => (
              <div key={booking.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div><p className="font-semibold text-sm">{booking.customer?.name || "Customer"}</p><p className="text-xs text-gray-500 line-clamp-1">{booking.problem}</p></div>
                  <span className={`tag text-xs ${booking.status === "COMPLETED" ? "tag-green" : booking.status === "PENDING" ? "tag-orange" : "tag-blue"}`}>{booking.status}</span>
                </div>
                {booking.status === "PENDING" && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={async () => { const token = localStorage.getItem("auth_token"); await axios.patch(`/api/bookings/${booking.id}`, { status: "ACCEPTED" }, { headers: { Authorization: `Bearer ${token}` } }); fetchBookings(); }} className="flex-1 btn-primary text-xs py-2">Accept</button>
                    <button onClick={async () => { const token = localStorage.getItem("auth_token"); await axios.patch(`/api/bookings/${booking.id}`, { status: "CANCELLED" }, { headers: { Authorization: `Bearer ${token}` } }); fetchBookings(); }} className="flex-1 btn-secondary text-xs py-2">Decline</button>
                  </div>
                )}
              </div>
            ))}</div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push("/provide/edit")} className="card p-4 text-left hover:shadow-md transition-shadow">
            <span className="text-2xl block mb-2">✏️</span>
            <p className="font-semibold text-sm">Edit Profile</p>
          </button>
          <button onClick={() => router.push("/bookings")} className="card p-4 text-left hover:shadow-md transition-shadow">
            <span className="text-2xl block mb-2">📋</span>
            <p className="font-semibold text-sm">All Bookings</p>
          </button>
        </div>
      </div>
    </div>
  );
}
