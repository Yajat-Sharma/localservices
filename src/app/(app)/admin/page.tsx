"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import axios from "axios";
import toast from "react-hot-toast";

const COLORS = ["#0c8ee8", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminPage() {
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState({ users: 0, providers: 0, bookings: 0, pendingProviders: 0 });
  const [pendingProviders, setPendingProviders] = useState<any[]>([]);
  const [allProviders, setAllProviders] = useState<any[]>([]);
  const [tab, setTab] = useState<"stats" | "pending" | "all">("stats");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "ADMIN") { router.replace("/hire"); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const [s, p, a] = await Promise.all([
        axios.get("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/admin/providers?approved=false", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/admin/providers", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setStats(s.data);
      setPendingProviders(p.data.providers);
      setAllProviders(a.data.providers);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  const approveProvider = async (id: string, approve: boolean) => {
    const token = localStorage.getItem("auth_token");
    try {
      await axios.patch(`/api/admin/providers/${id}`, { isApproved: approve }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(approve ? "Approved!" : "Rejected");
      fetchData();
    } catch { toast.error("Failed"); }
  };

  const verifyProvider = async (id: string, isVerified: boolean) => {
    const token = localStorage.getItem("auth_token");
    try {
      await axios.patch(`/api/admin/providers/${id}`, { isVerified }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(isVerified ? "Provider verified! ⭐" : "Badge removed");
      fetchData();
    } catch { toast.error("Failed"); }
  };

  const removeProvider = async (id: string) => {
    if (!confirm("Remove this provider?")) return;
    const token = localStorage.getItem("auth_token");
    try {
      await axios.delete(`/api/admin/providers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Removed");
      fetchData();
    } catch { toast.error("Failed"); }
  };

  // Chart data
  const barData = [
    { name: "Users", value: stats.users, color: "#0c8ee8" },
    { name: "Providers", value: stats.providers, color: "#10b981" },
    { name: "Bookings", value: stats.bookings, color: "#f59e0b" },
    { name: "Pending", value: stats.pendingProviders, color: "#ef4444" },
  ];

  // Category breakdown
  const categoryData = allProviders.reduce((acc: any[], p) => {
    const cat = p.category?.name || "Other";
    const existing = acc.find(a => a.name === cat);
    if (existing) existing.value++;
    else acc.push({ name: cat, value: 1 });
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav title={t("admin_panel")} />

      {/* Tabs */}
      <div className="bg-white px-4 py-3 border-b flex gap-2 overflow-x-auto scrollbar-hide">
        {([
          { key: "stats", label: "📊 Dashboard" },
          { key: "pending", label: `⏳ Pending (${stats.pendingProviders})` },
          { key: "all", label: "📋 All Providers" },
        ] as const).map(t_ => (
          <button key={t_.key} onClick={() => setTab(t_.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t_.key ? "bg-blue-500 text-white" : "text-gray-500 hover:text-gray-700"}`}>
            {t_.label}
          </button>
        ))}
      </div>

      <div className="p-4 animate-fade-in">
        {/* Dashboard Tab */}
        {tab === "stats" && (
          <div className="space-y-4">
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Users", value: stats.users, icon: "👤", color: "bg-blue-50 text-blue-700" },
                { label: "Providers", value: stats.providers, icon: "🏪", color: "bg-emerald-50 text-emerald-700" },
                { label: "Bookings", value: stats.bookings, icon: "📋", color: "bg-amber-50 text-amber-700" },
                { label: "Pending", value: stats.pendingProviders, icon: "⏳", color: "bg-red-50 text-red-700" },
              ].map(stat => (
                <div key={stat.label} className={`card p-4 ${stat.color}`}>
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-bold">{loading ? "—" : stat.value}</div>
                  <div className="text-xs font-medium mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Bar Chart */}
            <div className="card p-4">
              <h3 className="font-bold text-gray-900 mb-4">📊 Overview</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart - Category breakdown */}
            {categoryData.length > 0 && (
              <div className="card p-4">
                <h3 className="font-bold text-gray-900 mb-4">🥧 Providers by Category</h3>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {categoryData.map((_: any, index: number) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {categoryData.map((cat: any, i: number) => (
                      <div key={cat.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-xs text-gray-600 truncate">{cat.name}</span>
                        <span className="text-xs font-bold text-gray-900 ml-auto">{cat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="card p-4">
              <h3 className="font-bold text-gray-900 mb-3">📈 Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approval Rate</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {allProviders.length > 0
                      ? `${Math.round((allProviders.filter(p => p.isApproved).length / allProviders.length) * 100)}%`
                      : "0%"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Verified Providers</span>
                  <span className="text-sm font-bold text-blue-600">
                    {allProviders.filter(p => p.isVerified).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Available Now</span>
                  <span className="text-sm font-bold text-amber-600">
                    {allProviders.filter(p => p.isAvailable).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Free Slots Used</span>
                  <span className="text-sm font-bold text-gray-900">
                    {Math.min(allProviders.filter(p => p.isApproved).length, 50)}/50
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending & All tabs */}
        {(tab === "pending" || tab === "all") && (
          <div className="space-y-3">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="card h-24 skeleton" />)
            ) : (tab === "pending" ? pendingProviders : allProviders).length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-5xl mb-3">{tab === "pending" ? "✓" : "🏪"}</div>
                <p>{tab === "pending" ? "No pending approvals" : "No providers found"}</p>
              </div>
            ) : (
              (tab === "pending" ? pendingProviders : allProviders).map((prov: any) => (
                <div key={prov.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                      {prov.category?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1">
                            <h3 className="font-bold text-sm">{prov.businessName}</h3>
                            {prov.isVerified && <span className="text-blue-500 text-xs">✓</span>}
                          </div>
                          <p className="text-xs text-gray-500">{prov.category?.name} • {prov.city}</p>
                          <p className="text-xs text-gray-500">{prov.user?.phone}</p>
                        </div>
                        <span className={`tag ${prov.isApproved ? "tag-green" : "tag-orange"} flex-shrink-0`}>
                          {prov.isApproved ? "Approved" : "Pending"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {!prov.isApproved && (
                          <button onClick={() => approveProvider(prov.id, true)} className="btn-primary text-xs px-3 py-1.5">
                            ✓ Approve
                          </button>
                        )}
                        {prov.isApproved && (
                          <>
                            <button onClick={() => approveProvider(prov.id, false)} className="btn-secondary text-xs px-3 py-1.5">
                              Revoke
                            </button>
                            <button
                              onClick={() => verifyProvider(prov.id, !prov.isVerified)}
                              className={`text-xs px-3 py-1.5 rounded-xl transition-colors ${prov.isVerified ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                            >
                              {prov.isVerified ? "✓ Verified" : "⭐ Verify"}
                            </button>
                          </>
                        )}
                        <button onClick={() => removeProvider(prov.id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                          🗑 Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}