"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";
import axios from "axios";
import toast from "react-hot-toast";

export default function AdminPage() {
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState({ users:0, providers:0, bookings:0, pendingProviders:0 });
  const [pendingProviders, setPendingProviders] = useState<any[]>([]);
  const [allProviders, setAllProviders] = useState<any[]>([]);
  const [tab, setTab] = useState<"stats"|"pending"|"all">("stats");
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!user) { router.replace("/login"); return; } if (user.role !== "ADMIN") { router.replace("/hire"); return; } fetchData(); }, [user]);

  const fetchData = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const [s, p, a] = await Promise.all([
        axios.get("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/admin/providers?approved=false", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/admin/providers", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setStats(s.data); setPendingProviders(p.data.providers); setAllProviders(a.data.providers);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  const approveProvider = async (id: string, approve: boolean) => {
    const token = localStorage.getItem("auth_token");
    try { await axios.patch(`/api/admin/providers/${id}`, { isApproved: approve }, { headers: { Authorization: `Bearer ${token}` } }); toast.success(approve ? "Approved!" : "Rejected"); fetchData(); }
    catch { toast.error("Failed"); }
  };

  const removeProvider = async (id: string) => {
    if (!confirm("Remove this provider?")) return;
    const token = localStorage.getItem("auth_token");
    try { await axios.delete(`/api/admin/providers/${id}`, { headers: { Authorization: `Bearer ${token}` } }); toast.success("Removed"); fetchData(); }
    catch { toast.error("Failed"); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav title={t("admin_panel")} />
      <div className="bg-white px-4 py-3 border-b flex gap-2">
        {([{key:"stats",label:"📊 Stats"},{key:"pending",label:`⏳ Pending (${stats.pendingProviders})`},{key:"all",label:"📋 All"}] as const).map(t_ => (
          <button key={t_.key} onClick={() => setTab(t_.key)} className={`px-4 py-2 rounded-xl text-sm font-semibold ${tab === t_.key ? "bg-blue-500 text-white" : "text-gray-500"}`}>{t_.label}</button>
        ))}
      </div>
      <div className="p-4">
        {tab === "stats" && (
          <div className="grid grid-cols-2 gap-3">
            {[{label:t("total_users"),value:stats.users,icon:"👤",color:"bg-blue-50 text-blue-700"},{label:t("total_providers"),value:stats.providers,icon:"🏪",color:"bg-emerald-50 text-emerald-700"},{label:t("total_bookings"),value:stats.bookings,icon:"📋",color:"bg-amber-50 text-amber-700"},{label:t("pending_approvals"),value:stats.pendingProviders,icon:"⏳",color:"bg-red-50 text-red-700"}].map(stat => (
              <div key={stat.label} className={`card p-4 ${stat.color}`}><div className="text-2xl mb-2">{stat.icon}</div><div className="text-3xl font-bold">{stat.value}</div><div className="text-xs font-medium mt-1">{stat.label}</div></div>
            ))}
          </div>
        )}
        {(tab === "pending" || tab === "all") && (
          <div className="space-y-3">
            {(tab === "pending" ? pendingProviders : allProviders).map((prov: any) => (
              <div key={prov.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl">{prov.category?.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div><h3 className="font-bold text-sm">{prov.businessName}</h3><p className="text-xs text-gray-500">{prov.category?.name} • {prov.city}</p></div>
                      <span className={`tag ${prov.isApproved ? "tag-green" : "tag-orange"}`}>{prov.isApproved ? "Approved" : "Pending"}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {!prov.isApproved && <button onClick={() => approveProvider(prov.id, true)} className="btn-primary text-xs px-3 py-1.5">✓ Approve</button>}
                      {prov.isApproved && <button onClick={() => approveProvider(prov.id, false)} className="btn-secondary text-xs px-3 py-1.5">Revoke</button>}
                      <button onClick={() => removeProvider(prov.id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-xl">🗑 Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
