"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";
import axios from "axios";

export default function HistoryPage() {
  const { t } = useLanguage();
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace("/login"); return; }
    const token = localStorage.getItem("auth_token");
    axios.get("/api/bookings", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setBookings(res.data.bookings.filter((b: any) => ["COMPLETED","CANCELLED"].includes(b.status))))
      .finally(() => setLoading(false));
  }, [user, isLoading]);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav showBack onBack={() => router.back()} title={t("service_history")} />
      <div className="p-4 space-y-3">
        {loading ? [1,2,3].map(i => <div key={i} className="card h-24 skeleton" />) : bookings.length === 0 ? (
          <div className="text-center py-16"><div className="text-5xl mb-3">📭</div><p className="font-semibold text-gray-700">{t("no_history")}</p></div>
        ) : bookings.map((booking: any) => (
          <div key={booking.id} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><span className="text-xl">{booking.provider?.category?.icon}</span><div><p className="font-semibold text-sm">{booking.provider?.category?.name}</p><p className="text-xs text-gray-500">{booking.provider?.businessName}</p></div></div>
              <span className={`tag ${booking.status === "COMPLETED" ? "tag-green" : "tag-red"}`}>{booking.status === "COMPLETED" ? "✓ Completed" : "✕ Cancelled"}</span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-1 ml-8">{booking.problem}</p>
            <div className="flex justify-between mt-2 ml-8">
              {booking.price && <span className="text-xs font-bold">₹{booking.price}</span>}
              <span className="text-xs text-gray-400">{new Date(booking.createdAt).toLocaleDateString("en-IN")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
