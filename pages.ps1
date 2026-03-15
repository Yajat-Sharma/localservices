Set-Content -Path "src\app\(app)\bookings\page.tsx" -Value @'
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
'@

Set-Content -Path "src\app\(app)\profile\page.tsx" -Value @'
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";
import axios from "axios";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!user) { router.replace("/login"); return; } setName(user.name || ""); setEmail(user.email || ""); }, [user]);

  const handleSave = async () => {
    setLoading(true);
    const token = localStorage.getItem("auth_token");
    try { const res = await axios.patch("/api/auth/me", { name, email }, { headers: { Authorization: `Bearer ${token}` } }); setUser(res.data.user); setEditing(false); toast.success("Profile updated!"); }
    catch { toast.error("Failed to update"); }
    finally { setLoading(false); }
  };

  if (!user) return null;
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav showBack onBack={() => router.back()} title={t("profile")} />
      <div className="p-4 max-w-lg mx-auto">
        <div className="flex flex-col items-center py-6">
          <div className="w-24 h-24 rounded-full bg-blue-100 ring-4 ring-white shadow-lg flex items-center justify-center text-3xl font-bold text-blue-600">{user.name?.[0]?.toUpperCase() || "?"}</div>
          <h2 className="mt-3 text-xl font-bold">{user.name || "Your Name"}</h2>
          <p className="text-sm text-gray-500">{user.phone}</p>
          <span className={`mt-2 tag ${user.role === "PROVIDER" ? "tag-blue" : "tag-green"}`}>{user.role}</span>
        </div>
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Personal Info</h3>
            <button onClick={() => editing ? handleSave() : setEditing(true)} disabled={loading} className="text-sm font-semibold text-blue-600">{editing ? (loading ? "Saving..." : "Save") : t("edit")}</button>
          </div>
          <div className="space-y-3">
            <div><label className="text-xs font-semibold text-gray-500 uppercase">{t("full_name")}</label>{editing ? <input value={name} onChange={e => setName(e.target.value)} className="input-field mt-1 text-sm" /> : <p className="mt-1 text-sm font-medium">{user.name || "—"}</p>}</div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase">Phone</label><p className="mt-1 text-sm font-medium">{user.phone}</p></div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase">Email</label>{editing ? <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field mt-1 text-sm" /> : <p className="mt-1 text-sm font-medium">{user.email || "—"}</p>}</div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <button onClick={() => router.push("/bookings")} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200"><span className="text-sm font-medium">📋 {t("bookings")}</span><span>›</span></button>
          <button onClick={() => router.push("/history")} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200"><span className="text-sm font-medium">🕐 {t("service_history")}</span><span>›</span></button>
        </div>
      </div>
    </div>
  );
}
'@

Set-Content -Path "src\app\(app)\history\page.tsx" -Value @'
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";
import axios from "axios";

export default function HistoryPage() {
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    const token = localStorage.getItem("auth_token");
    axios.get("/api/bookings", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setBookings(res.data.bookings.filter((b: any) => ["COMPLETED","CANCELLED"].includes(b.status))))
      .finally(() => setLoading(false));
  }, [user]);

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
'@

Set-Content -Path "src\app\(app)\settings\page.tsx" -Value @'
"use client";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";

export default function SettingsPage() {
  const { t } = useLanguage();
  const { logout } = useAuthStore();
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav showBack onBack={() => router.back()} title={t("settings")} />
      <div className="p-4 space-y-4">
        <div className="card p-4"><h3 className="font-bold mb-4">Preferences</h3><div className="flex items-center justify-between"><div><p className="font-medium text-sm">Language</p><p className="text-xs text-gray-500">Choose your preferred language</p></div><LanguageSwitcher /></div></div>
        <div className="card p-4"><h3 className="font-bold mb-4">Account</h3><button onClick={() => router.push("/profile")} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50"><span className="text-sm font-medium">👤 Edit Profile</span><span>›</span></button></div>
        <button onClick={() => { logout(); router.replace("/"); }} className="w-full p-4 bg-red-50 text-red-600 rounded-2xl font-semibold border border-red-100">🚪 {t("logout")}</button>
      </div>
    </div>
  );
}
'@

Set-Content -Path "src\app\(app)\admin\page.tsx" -Value @'
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
'@

Write-Host "All pages fixed!" -ForegroundColor Green