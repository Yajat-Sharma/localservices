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
