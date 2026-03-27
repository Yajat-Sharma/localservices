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
  const [docProviders, setDocProviders] = useState<any[]>([]);
  const [tab, setTab] = useState<"stats" | "pending" | "all" | "documents">("stats");
  const [loading, setLoading] = useState(true);
  const [viewingProvider, setViewingProvider] = useState<any>(null);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "ADMIN") { router.replace("/hire"); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const [s, p, a, d] = await Promise.all([
        axios.get("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/admin/providers?approved=false", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/admin/providers", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/admin/documents", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setStats(s.data);
      setPendingProviders(p.data.providers);
      setAllProviders(a.data.providers);
      setDocProviders(d.data.providers);
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
      toast.success(isVerified ? "Provider verified!" : "Badge removed");
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

  const reviewDocument = async (providerId: string, type: "idProofStatus" | "licenseStatus", status: "APPROVED" | "REJECTED") => {
    const token = localStorage.getItem("auth_token");
    try {
      await axios.patch("/api/admin/documents", { providerId, [type]: status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(status === "APPROVED" ? "Document approved!" : "Document rejected");
      fetchData();
    } catch { toast.error("Failed"); }
  };

  const barData = [
    { name: "Users", value: stats.users, color: "#0c8ee8" },
    { name: "Providers", value: stats.providers, color: "#10b981" },
    { name: "Bookings", value: stats.bookings, color: "#f59e0b" },
    { name: "Pending", value: stats.pendingProviders, color: "#ef4444" },
  ];

  const categoryData = allProviders.reduce((acc: any[], p) => {
    const cat = p.category?.name || "Other";
    const existing = acc.find(a => a.name === cat);
    if (existing) existing.value++;
    else acc.push({ name: cat, value: 1 });
    return acc;
  }, []);

  const pendingDocs = docProviders.filter(p =>
    p.idProofStatus === "PENDING" || p.licenseStatus === "PENDING"
  ).length;

  const ProviderCard = ({ prov, showApprove = false }: { prov: any; showApprove?: boolean }) => (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-xl flex-shrink-0">
          {prov.category?.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{prov.businessName}</h3>
                {prov.isVerified && (
                  <span className="verified-badge flex items-center gap-0.5">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{prov.category?.name} • {prov.city}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{prov.user?.phone}</p>
            </div>
            <span className={`tag ${prov.isApproved ? "tag-green" : "tag-orange"} flex-shrink-0`}>
              {prov.isApproved ? "Approved" : "Pending"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {/* View Profile Button */}
            <button
              onClick={() => setViewingProvider(prov)}
              className="text-xs px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:bg-blue-100 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              View
            </button>

            {showApprove && !prov.isApproved && (
              <button onClick={() => approveProvider(prov.id, true)} className="btn-primary text-xs px-3 py-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="inline mr-1">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Approve
              </button>
            )}
            {prov.isApproved && (
              <>
                <button
                  onClick={() => approveProvider(prov.id, false)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-100 transition-colors"
                >
                  Revoke
                </button>
                <button
                  onClick={() => verifyProvider(prov.id, !prov.isVerified)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                    prov.isVerified
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200"
                      : "bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {prov.isVerified ? "✓ Verified" : "Verify"}
                </button>
              </>
            )}
            <button
              onClick={() => removeProvider(prov.id)}
              className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-100 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <TopNav title={t("admin_panel")} />

      {/* Tabs */}
      <div className="glass-nav px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {([
          { key: "stats", label: "Dashboard" },
          { key: "pending", label: `Pending (${stats.pendingProviders})` },
          { key: "all", label: "All Providers" },
          { key: "documents", label: `Documents${pendingDocs > 0 ? ` (${pendingDocs})` : ""}` },
        ] as const).map(t_ => (
          <button
            key={t_.key}
            onClick={() => setTab(t_.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t_.key ? "bg-blue-500 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            {t_.label}
          </button>
        ))}
      </div>

      <div className="p-4 animate-fade-in pb-8">

        {/* Dashboard Tab */}
        {tab === "stats" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Users", value: stats.users, color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300", icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                )},
                { label: "Providers", value: stats.providers, color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300", icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                )},
                { label: "Bookings", value: stats.bookings, color: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300", icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                )},
                { label: "Pending", value: stats.pendingProviders, color: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300", icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                )},
              ].map(stat => (
                <div key={stat.label} className={`card p-4 ${stat.color}`}>
                  <div className="mb-2 opacity-80">{stat.icon}</div>
                  <div className="text-3xl font-bold">{loading ? "—" : stat.value}</div>
                  <div className="text-xs font-medium mt-1 opacity-80">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="card p-4">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Overview</h3>
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

            {categoryData.length > 0 && (
              <div className="card p-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Providers by Category</h3>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
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
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{cat.name}</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white ml-auto">{cat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="card p-4">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Quick Stats</h3>
              <div className="space-y-3">
                {[
                  { label: "Approval Rate", value: allProviders.length > 0 ? `${Math.round((allProviders.filter(p => p.isApproved).length / allProviders.length) * 100)}%` : "0%", color: "text-emerald-600" },
                  { label: "Verified Providers", value: allProviders.filter(p => p.isVerified).length, color: "text-blue-600" },
                  { label: "Available Now", value: allProviders.filter(p => p.isAvailable).length, color: "text-amber-600" },
                  { label: "Docs Pending Review", value: pendingDocs, color: "text-red-600" },
                  { label: "Free Slots Used", value: `${Math.min(allProviders.filter(p => p.isApproved).length, 50)}/50`, color: "text-gray-900 dark:text-white" },
                ].map(stat => (
                  <div key={stat.label} className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-slate-800 last:border-0">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</span>
                    <span className={`text-sm font-bold ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
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
              <div className="text-center py-12 card p-8">
                <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  </svg>
                </div>
                <p className="font-semibold text-gray-600 dark:text-gray-300">
                  {tab === "pending" ? "No pending approvals" : "No providers found"}
                </p>
              </div>
            ) : (
              (tab === "pending" ? pendingProviders : allProviders).map((prov: any) => (
                <ProviderCard key={prov.id} prov={prov} showApprove={tab === "pending"} />
              ))
            )}
          </div>
        )}

        {/* Documents Tab */}
        {tab === "documents" && (
          <div className="space-y-4">
            {loading ? (
              [1, 2].map(i => <div key={i} className="card h-48 skeleton" />)
            ) : docProviders.length === 0 ? (
              <div className="text-center py-12 card p-8">
                <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <p className="font-semibold text-gray-600 dark:text-gray-300">No documents uploaded yet</p>
                <p className="text-sm text-gray-400 mt-1">Documents will appear here when providers upload them</p>
              </div>
            ) : (
              docProviders.map((prov: any) => (
                <div key={prov.id} className="card p-4">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-slate-700">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-lg">
                      {prov.category?.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <h3 className="font-bold text-sm dark:text-white">{prov.businessName}</h3>
                        {prov.isVerified && <span className="verified-badge">Verified</span>}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{prov.user?.phone} • {prov.city}</p>
                    </div>
                  </div>

                  {prov.idProofUrl && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">ID Proof</p>
                        <span className={`tag ${prov.idProofStatus === "APPROVED" ? "tag-green" : prov.idProofStatus === "REJECTED" ? "tag-red" : "tag-orange"}`}>
                          {prov.idProofStatus === "APPROVED" ? "Approved" : prov.idProofStatus === "REJECTED" ? "Rejected" : "Pending"}
                        </span>
                      </div>
                      <a href={prov.idProofUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <div className="relative h-36 rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-700 hover:opacity-90 transition-opacity">
                          <img src={prov.idProofUrl} alt="ID Proof" className="w-full h-full object-cover" />
                        </div>
                      </a>
                      {prov.idProofStatus === "PENDING" && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => reviewDocument(prov.id, "idProofStatus", "APPROVED")} className="flex-1 btn-primary text-xs py-2">Approve ID</button>
                          <button onClick={() => reviewDocument(prov.id, "idProofStatus", "REJECTED")} className="flex-1 text-xs py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl hover:bg-red-100 transition-colors">Reject ID</button>
                        </div>
                      )}
                    </div>
                  )}

                  {prov.licenseUrl && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Business License</p>
                        <span className={`tag ${prov.licenseStatus === "APPROVED" ? "tag-green" : prov.licenseStatus === "REJECTED" ? "tag-red" : "tag-orange"}`}>
                          {prov.licenseStatus === "APPROVED" ? "Approved" : prov.licenseStatus === "REJECTED" ? "Rejected" : "Pending"}
                        </span>
                      </div>
                      <a href={prov.licenseUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <div className="relative h-36 rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-700 hover:opacity-90 transition-opacity">
                          <img src={prov.licenseUrl} alt="License" className="w-full h-full object-cover" />
                        </div>
                      </a>
                      {prov.licenseStatus === "PENDING" && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => reviewDocument(prov.id, "licenseStatus", "APPROVED")} className="flex-1 btn-primary text-xs py-2">Approve License</button>
                          <button onClick={() => reviewDocument(prov.id, "licenseStatus", "REJECTED")} className="flex-1 text-xs py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl hover:bg-red-100 transition-colors">Reject License</button>
                        </div>
                      )}
                    </div>
                  )}

                  {prov.idProofStatus === "APPROVED" && prov.licenseStatus === "APPROVED" && !prov.isVerified && (
                    <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Both documents approved! Provider will be auto-verified.</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Provider Profile View Modal */}
      {viewingProvider && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center">
          <div
            className="fixed inset-0 z-40"
            onClick={() => setViewingProvider(null)}
          />
          <div className="relative w-full md:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-y-auto animate-slide-up z-50">

            {/* Header */}
            <div className="sticky top-0 glass-nav px-5 py-4 flex items-center justify-between z-10 rounded-t-3xl">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Provider Profile</h2>
              <button
                onClick={() => setViewingProvider(null)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Business Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.1), rgba(79,70,229,0.1))" }}>
                  {viewingProvider.category?.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white">{viewingProvider.businessName}</h3>
                    {viewingProvider.isVerified && (
                      <span className="verified-badge flex items-center gap-1">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{viewingProvider.category?.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`tag ${viewingProvider.isApproved ? "tag-green" : "tag-orange"}`}>
                      {viewingProvider.isApproved ? "Approved" : "Pending"}
                    </span>
                    <span className={`tag ${viewingProvider.isAvailable ? "tag-green" : "tag-red"}`}>
                      {viewingProvider.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Rating", value: viewingProvider.avgRating?.toFixed(1) || "0.0", color: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300" },
                  { label: "Bookings", value: viewingProvider.totalBookings || 0, color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" },
                  { label: "Reviews", value: viewingProvider.totalReviews || 0, color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" },
                ].map(stat => (
                  <div key={stat.label} className={`${stat.color} rounded-2xl p-3 text-center`}>
                    <div className="font-bold text-2xl">{stat.value}</div>
                    <div className="text-xs font-medium mt-0.5 opacity-80">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div className="card p-4 space-y-2.5">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">Contact Info</h4>
                {[
                  { label: viewingProvider.user?.phone, icon: "phone" },
                  { label: viewingProvider.user?.email, icon: "email" },
                  { label: viewingProvider.whatsapp, icon: "whatsapp" },
                ].filter(c => c.label).map((contact, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round">
                        {contact.icon === "phone" ? (
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.35 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.83-1.83a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                        ) : (
                          <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>
                        )}
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{contact.label}</span>
                  </div>
                ))}
              </div>

              {/* Location */}
              <div className="card p-4">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Location</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {viewingProvider.address}, {viewingProvider.city}, {viewingProvider.state} – {viewingProvider.pincode}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-2.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Service Radius</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{viewingProvider.serviceRadius}km</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-2.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Price Range</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">₹{viewingProvider.priceMin}–₹{viewingProvider.priceMax}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {viewingProvider.description && (
                <div className="card p-4">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-2">About</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{viewingProvider.description}</p>
                </div>
              )}

              {/* Documents */}
              {(viewingProvider.idProofUrl || viewingProvider.licenseUrl) && (
                <div className="card p-4">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Documents</h4>
                  <div className="space-y-2">
                    {[
                      { label: "ID Proof", url: viewingProvider.idProofUrl, status: viewingProvider.idProofStatus },
                      { label: "License", url: viewingProvider.licenseUrl, status: viewingProvider.licenseStatus },
                    ].filter(d => d.url).map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{doc.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`tag ${doc.status === "APPROVED" ? "tag-green" : doc.status === "REJECTED" ? "tag-red" : "tag-orange"}`}>
                            {doc.status}
                          </span>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-semibold hover:underline">
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio */}
              {viewingProvider.portfolio?.length > 0 && (
                <div className="card p-4">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-3">
                    Portfolio ({viewingProvider.portfolio.length} photos)
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingProvider.portfolio.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-700">
                          <img src={url} alt={`Portfolio ${i}`} className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pb-2">
                <button
                  onClick={() => {
                    verifyProvider(viewingProvider.id, !viewingProvider.isVerified);
                    setViewingProvider({ ...viewingProvider, isVerified: !viewingProvider.isVerified });
                  }}
                  className={`flex-1 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    viewingProvider.isVerified
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {viewingProvider.isVerified ? "Remove Badge" : "Verify Provider"}
                </button>
                <button
                  onClick={() => { removeProvider(viewingProvider.id); setViewingProvider(null); }}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                  Remove Provider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}