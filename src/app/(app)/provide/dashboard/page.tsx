"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import axios from "axios";
import toast from "react-hot-toast";

const COLORS = ["#7c3aed", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

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
      toast.success(approve ? "Provider approved!" : "Approval revoked");
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
    if (!confirm("Remove this provider permanently?")) return;
    const token = localStorage.getItem("auth_token");
    try {
      await axios.delete(`/api/admin/providers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Provider removed");
      setViewingProvider(null);
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

  const pendingDocs = docProviders.filter(p => p.idProofStatus === "PENDING" || p.licenseStatus === "PENDING").length;

  const barData = [
    { name: "Users",    value: stats.users,            color: "#7c3aed" },
    { name: "Providers",value: stats.providers,         color: "#ec4899" },
    { name: "Bookings", value: stats.bookings,          color: "#f59e0b" },
    { name: "Pending",  value: stats.pendingProviders,  color: "#ef4444" },
  ];

  const categoryData = allProviders.reduce((acc: any[], p) => {
    const cat = p.category?.name || "Other";
    const existing = acc.find(a => a.name === cat);
    if (existing) existing.value++;
    else acc.push({ name: cat, value: 1 });
    return acc;
  }, []);

  const tabs = [
    { key: "stats",     label: "Dashboard" },
    { key: "pending",   label: `Pending (${stats.pendingProviders})` },
    { key: "all",       label: "All Providers" },
    { key: "documents", label: `Docs${pendingDocs > 0 ? ` (${pendingDocs})` : ""}` },
  ] as const;

  const ProviderRow = ({ prov, showApprove }: { prov: any; showApprove?: boolean }) => (
    <div className="card p-4 overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: prov.isApproved ? "linear-gradient(#10b981, #059669)" : "linear-gradient(#f59e0b, #d97706)" }} />
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.06))" }}>
          {prov.category?.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-black text-sm" style={{ color: "var(--text-primary)" }}>{prov.businessName}</h3>
                {prov.isVerified && (
                  <span className="verified-badge flex items-center gap-0.5 text-[10px]">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {prov.category?.name} · {prov.city} · {prov.user?.phone}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: prov.isApproved ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: prov.isApproved ? "#059669" : "#d97706" }}>
                  {prov.isApproved ? "Approved" : "Pending"}
                </span>
                <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  ⭐ {(prov.avgRating || 0).toFixed(1)} · {prov.totalBookings || 0} bookings
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <button onClick={() => setViewingProvider(prov)}
              className="text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all"
              style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.2)" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              View
            </button>

            {showApprove && !prov.isApproved && (
              <button onClick={() => approveProvider(prov.id, true)}
                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Approve
              </button>
            )}

            {prov.isApproved && (
              <>
                <button onClick={() => approveProvider(prov.id, false)}
                  className="text-xs px-3 py-1.5 rounded-xl font-bold"
                  style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                  Revoke
                </button>
                <button onClick={() => verifyProvider(prov.id, !prov.isVerified)}
                  className="text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
                  style={prov.isVerified ? { background: "rgba(124,58,237,0.1)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.2)" }
                    : { background: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                  {prov.isVerified ? "✓ Verified" : "Verify"}
                </button>
              </>
            )}

            <button onClick={() => removeProvider(prov.id)}
              className="text-xs px-3 py-1.5 rounded-xl font-bold"
              style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.15)" }}>
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <TopNav title={t("admin_panel")} />

      {/* Tabs */}
      <div className="glass-nav px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
            style={tab === tb.key ? {
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              color: "white",
              boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
            } : {
              color: "var(--text-muted)",
              background: "transparent",
            }}>
            {tb.label}
          </button>
        ))}
      </div>

      <div className="p-4 pb-10 animate-fade-in">

        {/* ── DASHBOARD TAB ── */}
        {tab === "stats" && (
          <div className="space-y-4">

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Users",    value: stats.users,           color: "#7c3aed", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                { label: "Providers",value: stats.providers,        color: "#ec4899", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> },
                { label: "Bookings", value: stats.bookings,         color: "#f59e0b", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg> },
                { label: "Pending",  value: stats.pendingProviders, color: "#ef4444", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
              ].map(stat => (
                <div key={stat.label} className="card p-4 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-3xl opacity-10"
                    style={{ background: stat.color }} />
                  <div className="mb-2 opacity-70" style={{ color: stat.color }}>{stat.icon}</div>
                  <div className="text-3xl font-black" style={{ color: stat.color }}>
                    {loading ? "—" : stat.value}
                  </div>
                  <div className="text-xs font-semibold mt-1" style={{ color: "var(--text-muted)" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className="card p-4">
              <h3 className="font-black text-base mb-4" style={{ color: "var(--text-primary)" }}>Overview</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barSize={32}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", boxShadow: "var(--shadow-md)" }}
                    labelStyle={{ color: "var(--text-primary)", fontWeight: 700 }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            {categoryData.length > 0 && (
              <div className="card p-4">
                <h3 className="font-black text-base mb-4" style={{ color: "var(--text-primary)" }}>Providers by Category</h3>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={160}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" outerRadius={65} innerRadius={30} dataKey="value"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {categoryData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {categoryData.map((cat: any, i: number) => (
                      <div key={cat.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-xs font-medium flex-1 truncate" style={{ color: "var(--text-secondary)" }}>{cat.name}</span>
                        <span className="text-xs font-black" style={{ color: "var(--text-primary)" }}>{cat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="card p-4">
              <h3 className="font-black text-base mb-3" style={{ color: "var(--text-primary)" }}>Platform Health</h3>
              <div className="space-y-3">
                {[
                  { label: "Approval Rate", value: allProviders.length > 0 ? `${Math.round((allProviders.filter(p => p.isApproved).length / allProviders.length) * 100)}%` : "0%", color: "#059669" },
                  { label: "Verified Providers", value: allProviders.filter(p => p.isVerified).length, color: "#7c3aed" },
                  { label: "Available Now", value: allProviders.filter(p => p.isAvailable).length, color: "#ec4899" },
                  { label: "Docs Pending Review", value: pendingDocs, color: "#d97706" },
                  { label: "Free Slots Used", value: `${Math.min(allProviders.filter(p => p.isApproved).length, 50)}/50`, color: "var(--text-primary)" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0"
                    style={{ borderColor: "var(--border)" }}>
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                    <span className="text-sm font-black" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PENDING & ALL TABS ── */}
        {(tab === "pending" || tab === "all") && (
          <div className="space-y-3 mt-2">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-3xl" />)
            ) : (tab === "pending" ? pendingProviders : allProviders).length === 0 ? (
              <div className="card p-10 text-center">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.06))" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  </svg>
                </div>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                  {tab === "pending" ? "No pending approvals" : "No providers yet"}
                </p>
              </div>
            ) : (
              (tab === "pending" ? pendingProviders : allProviders).map((prov: any) => (
                <ProviderRow key={prov.id} prov={prov} showApprove={tab === "pending"} />
              ))
            )}
          </div>
        )}

        {/* ── DOCUMENTS TAB ── */}
        {tab === "documents" && (
          <div className="space-y-4 mt-2">
            {loading ? (
              [1,2].map(i => <div key={i} className="skeleton h-48 rounded-3xl" />)
            ) : docProviders.length === 0 ? (
              <div className="card p-10 text-center">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.06))" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>No documents yet</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Documents will appear when providers upload them</p>
              </div>
            ) : (
              docProviders.map((prov: any) => (
                <div key={prov.id} className="card p-4">
                  {/* Provider info */}
                  <div className="flex items-center gap-3 pb-3 mb-3 border-b" style={{ borderColor: "var(--border)" }}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                      style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.06))" }}>
                      {prov.category?.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-black text-sm" style={{ color: "var(--text-primary)" }}>{prov.businessName}</h3>
                        {prov.isVerified && <span className="verified-badge text-[10px]">✓ Verified</span>}
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{prov.user?.phone} · {prov.city}</p>
                    </div>
                  </div>

                  {/* ID Proof */}
                  {prov.idProofUrl && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>ID Proof</p>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={prov.idProofStatus === "APPROVED" ? { background: "rgba(16,185,129,0.1)", color: "#059669" }
                            : prov.idProofStatus === "REJECTED" ? { background: "rgba(239,68,68,0.1)", color: "#dc2626" }
                            : { background: "rgba(245,158,11,0.1)", color: "#d97706" }}>
                          {prov.idProofStatus}
                        </span>
                      </div>
                      <a href={prov.idProofUrl} target="_blank" rel="noopener noreferrer">
                        <div className="h-32 rounded-2xl overflow-hidden hover:opacity-90 transition-opacity"
                          style={{ border: "1px solid var(--border)" }}>
                          <img src={prov.idProofUrl} alt="ID Proof" className="w-full h-full object-cover" />
                        </div>
                      </a>
                      {prov.idProofStatus === "PENDING" && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => reviewDocument(prov.id, "idProofStatus", "APPROVED")}
                            className="flex-1 btn-primary text-xs py-2">Approve</button>
                          <button onClick={() => reviewDocument(prov.id, "idProofStatus", "REJECTED")}
                            className="flex-1 text-xs py-2 rounded-2xl font-bold"
                            style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.15)" }}>
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* License */}
                  {prov.licenseUrl && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Business License</p>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={prov.licenseStatus === "APPROVED" ? { background: "rgba(16,185,129,0.1)", color: "#059669" }
                            : prov.licenseStatus === "REJECTED" ? { background: "rgba(239,68,68,0.1)", color: "#dc2626" }
                            : { background: "rgba(245,158,11,0.1)", color: "#d97706" }}>
                          {prov.licenseStatus}
                        </span>
                      </div>
                      <a href={prov.licenseUrl} target="_blank" rel="noopener noreferrer">
                        <div className="h-32 rounded-2xl overflow-hidden hover:opacity-90 transition-opacity"
                          style={{ border: "1px solid var(--border)" }}>
                          <img src={prov.licenseUrl} alt="License" className="w-full h-full object-cover" />
                        </div>
                      </a>
                      {prov.licenseStatus === "PENDING" && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => reviewDocument(prov.id, "licenseStatus", "APPROVED")}
                            className="flex-1 btn-primary text-xs py-2">Approve</button>
                          <button onClick={() => reviewDocument(prov.id, "licenseStatus", "REJECTED")}
                            className="flex-1 text-xs py-2 rounded-2xl font-bold"
                            style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.15)" }}>
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {prov.idProofStatus === "APPROVED" && prov.licenseStatus === "APPROVED" && !prov.isVerified && (
                    <div className="mt-3 p-3 rounded-2xl"
                      style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <p className="text-xs font-bold" style={{ color: "#059669" }}>
                        ✅ Both documents approved — provider will be auto-verified!
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── PROVIDER PROFILE MODAL ── */}
      {viewingProvider && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="fixed inset-0" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onClick={() => setViewingProvider(null)} />
          <div className="relative w-full md:max-w-lg rounded-t-3xl md:rounded-3xl z-10 max-h-[90vh] overflow-y-auto animate-slide-up"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 -8px 48px rgba(124,58,237,0.2)" }}>

            {/* Modal header */}
            <div className="sticky top-0 glass-nav px-5 py-4 flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-black text-lg" style={{ color: "var(--text-primary)" }}>Provider Profile</h2>
              <button onClick={() => setViewingProvider(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Business info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.06))" }}>
                  {viewingProvider.category?.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-xl" style={{ color: "var(--text-primary)" }}>{viewingProvider.businessName}</h3>
                    {viewingProvider.isVerified && <span className="verified-badge">✓ Verified</span>}
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{viewingProvider.category?.name}</p>
                  <div className="flex gap-2 mt-1.5">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={viewingProvider.isApproved ? { background: "rgba(16,185,129,0.1)", color: "#059669" } : { background: "rgba(245,158,11,0.1)", color: "#d97706" }}>
                      {viewingProvider.isApproved ? "Approved" : "Pending"}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={viewingProvider.isAvailable ? { background: "rgba(16,185,129,0.1)", color: "#059669" } : { background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
                      {viewingProvider.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Rating",   value: (viewingProvider.avgRating || 0).toFixed(1), color: "#f59e0b" },
                  { label: "Bookings", value: viewingProvider.totalBookings || 0,           color: "#7c3aed" },
                  { label: "Reviews",  value: viewingProvider.totalReviews || 0,            color: "#ec4899" },
                ].map(s => (
                  <div key={s.label} className="card p-3 text-center">
                    <p className="font-black text-2xl" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div className="card p-4 space-y-2.5">
                <h4 className="font-black text-sm" style={{ color: "var(--text-primary)" }}>Contact</h4>
                {[viewingProvider.user?.phone, viewingProvider.user?.email, viewingProvider.whatsapp].filter(Boolean).map((c, i) => (
                  <div key={i} className="flex items-center gap-3 py-1">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(124,58,237,0.08)" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round">
                        {i === 0 ? <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.35 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.83-1.83a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                        : <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>}
                      </svg>
                    </div>
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{c}</span>
                  </div>
                ))}
              </div>

              {/* Location */}
              <div className="card p-4">
                <h4 className="font-black text-sm mb-2" style={{ color: "var(--text-primary)" }}>Location</h4>
                <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                  {viewingProvider.address}, {viewingProvider.city}, {viewingProvider.state} – {viewingProvider.pincode}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="px-3 py-2 rounded-xl" style={{ background: "var(--bg-subtle)" }}>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Service Radius</p>
                    <p className="font-black text-sm" style={{ color: "var(--text-primary)" }}>{viewingProvider.serviceRadius}km</p>
                  </div>
                  <div className="px-3 py-2 rounded-xl" style={{ background: "var(--bg-subtle)" }}>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Price Range</p>
                    <p className="font-black text-sm gradient-text">₹{viewingProvider.priceMin}–₹{viewingProvider.priceMax}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {viewingProvider.description && (
                <div className="card p-4">
                  <h4 className="font-black text-sm mb-2" style={{ color: "var(--text-primary)" }}>About</h4>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{viewingProvider.description}</p>
                </div>
              )}

              {/* Documents */}
              {(viewingProvider.idProofUrl || viewingProvider.licenseUrl) && (
                <div className="card p-4">
                  <h4 className="font-black text-sm mb-3" style={{ color: "var(--text-primary)" }}>Documents</h4>
                  {[
                    { label: "ID Proof", url: viewingProvider.idProofUrl, status: viewingProvider.idProofStatus },
                    { label: "License",  url: viewingProvider.licenseUrl,  status: viewingProvider.licenseStatus },
                  ].filter(d => d.url).map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl mb-2"
                      style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                      <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{doc.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={doc.status === "APPROVED" ? { background: "rgba(16,185,129,0.1)", color: "#059669" }
                            : doc.status === "REJECTED" ? { background: "rgba(239,68,68,0.1)", color: "#dc2626" }
                            : { background: "rgba(245,158,11,0.1)", color: "#d97706" }}>
                          {doc.status}
                        </span>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-bold gradient-text hover:opacity-80">View</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Portfolio */}
              {viewingProvider.portfolio?.length > 0 && (
                <div className="card p-4">
                  <h4 className="font-black text-sm mb-3" style={{ color: "var(--text-primary)" }}>
                    Portfolio ({viewingProvider.portfolio.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingProvider.portfolio.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <div className="aspect-square rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                          <img src={url} alt="" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pb-2">
                <button
                  onClick={() => { verifyProvider(viewingProvider.id, !viewingProvider.isVerified); setViewingProvider({ ...viewingProvider, isVerified: !viewingProvider.isVerified }); }}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all"
                  style={viewingProvider.isVerified
                    ? { background: "rgba(124,58,237,0.1)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.2)" }
                    : { background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.06))", color: "var(--primary)", border: "1px solid var(--border)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {viewingProvider.isVerified ? "Remove Badge" : "Verify Provider"}
                </button>
                <button onClick={() => { removeProvider(viewingProvider.id); }}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}