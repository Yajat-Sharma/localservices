"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { useAuthStore } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import axios from "axios";

export default function EarningsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    if (!user.provider) { router.replace("/provide/register"); return; }
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const res = await axios.get("/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data.bookings);
    } catch {} finally { setLoading(false); }
  };

  const completedBookings = bookings.filter(b => b.status === "COMPLETED");
  const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const avgEarning = completedBookings.length > 0 ? totalEarnings / completedBookings.length : 0;
  const pendingBookings = bookings.filter(b => b.status === "PENDING").length;
  const thisMonthBookings = completedBookings.filter(b => {
    const date = new Date(b.completedAt || b.createdAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const thisMonthEarnings = thisMonthBookings.reduce((sum, b) => sum + (b.price || 0), 0);

  // Monthly earnings chart data
  const monthlyData = completedBookings.reduce((acc: any[], b) => {
    const date = new Date(b.completedAt || b.createdAt);
    const month = date.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    const existing = acc.find(a => a.month === month);
    if (existing) {
      existing.earnings += b.price || 0;
      existing.jobs++;
    } else {
      acc.push({ month, earnings: b.price || 0, jobs: 1 });
    }
    return acc;
  }, []).slice(-6);

  // Recent completed jobs
  const recentJobs = completedBookings.slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav showBack onBack={() => router.back()} title="Earnings Dashboard" />
      <div className="p-4 space-y-4 pb-8 animate-fade-in">

        {/* Total Earnings Hero */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-6 text-white">
          <p className="text-emerald-200 text-sm font-medium">Total Earnings</p>
          <h2 className="text-4xl font-bold mt-1">₹{totalEarnings.toLocaleString("en-IN")}</h2>
          <div className="flex items-center gap-4 mt-4">
            <div>
              <p className="text-emerald-200 text-xs">This Month</p>
              <p className="text-white font-bold text-lg">₹{thisMonthEarnings.toLocaleString("en-IN")}</p>
            </div>
            <div className="w-px h-8 bg-emerald-400" />
            <div>
              <p className="text-emerald-200 text-xs">Avg per Job</p>
              <p className="text-white font-bold text-lg">₹{Math.round(avgEarning)}</p>
            </div>
            <div className="w-px h-8 bg-emerald-400" />
            <div>
              <p className="text-emerald-200 text-xs">Total Jobs</p>
              <p className="text-white font-bold text-lg">{completedBookings.length}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Completed", value: completedBookings.length, icon: "✅", color: "bg-emerald-50 text-emerald-700" },
            { label: "Pending", value: pendingBookings, icon: "⏳", color: "bg-amber-50 text-amber-700" },
            { label: "This Month", value: thisMonthBookings.length, icon: "📅", color: "bg-blue-50 text-blue-700" },
            { label: "Total Requests", value: bookings.length, icon: "📋", color: "bg-purple-50 text-purple-700" },
          ].map(stat => (
            <div key={stat.label} className={`card p-4 ${stat.color}`}>
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs font-medium mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Monthly Earnings Chart */}
        {monthlyData.length > 0 && (
          <div className="card p-4">
            <h3 className="font-bold text-gray-900 mb-4">📈 Monthly Earnings</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`₹${value}`, "Earnings"]} />
                <Bar dataKey="earnings" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Jobs chart */}
        {monthlyData.length > 0 && (
          <div className="card p-4">
            <h3 className="font-bold text-gray-900 mb-4">📊 Jobs per Month</h3>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [value, "Jobs"]} />
                <Line type="monotone" dataKey="jobs" stroke="#0c8ee8" strokeWidth={2} dot={{ fill: "#0c8ee8", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Jobs */}
        <div>
          <h3 className="section-title mb-3">Recent Completed Jobs</h3>
          {loading ? (
            [1,2,3].map(i => <div key={i} className="card h-16 skeleton mb-3" />)
          ) : recentJobs.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-2">💼</div>
              <p className="text-sm text-gray-500">No completed jobs yet</p>
              <p className="text-xs text-gray-400 mt-1">Complete your first job to see earnings!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map(booking => (
                <div key={booking.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-lg">
                        {booking.provider?.category?.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{booking.customer?.name || "Customer"}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{booking.problem}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(booking.completedAt || booking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {booking.price ? (
                        <p className="font-bold text-emerald-600">₹{booking.price}</p>
                      ) : (
                        <p className="text-xs text-gray-400">No price set</p>
                      )}
                      <span className="tag tag-green text-xs mt-1">✓ Done</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <h4 className="font-bold text-blue-900 text-sm mb-2">💡 Tips to earn more</h4>
          <ul className="space-y-1.5">
            {[
              "Set competitive prices to attract more customers",
              "Complete jobs quickly to get more bookings",
              "Ask customers to rate you after each job",
              "Keep your availability updated",
            ].map((tip, i) => (
              <li key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
                <span className="text-blue-400 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}