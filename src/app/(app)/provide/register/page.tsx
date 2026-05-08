"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore, useLocationStore } from "@/lib/store";
import axios from "axios";
import toast from "react-hot-toast";

export default function ProviderRegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user, setUser, isLoading } = useAuthStore();
  const { latitude, longitude, setLocation } = useLocationStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [freeSlots, setFreeSlots] = useState(50);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ businessName:"", categoryId:"", description:"", priceMin:"", priceMax:"", address:"", city:"", state:"", pincode:"", whatsapp:"", allowMultiple:false });

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (user.provider) { router.replace("/provide/dashboard"); return; }
    axios.get("/api/categories").then(res => { setCategories(res.data.categories); setFreeSlots(res.data.freeSlots || 50); });
    navigator.geolocation?.getCurrentPosition((pos) => setLocation(pos.coords.latitude, pos.coords.longitude), () => {});
  }, [user, isLoading]);

  const handleSubmit = async () => {
    if (!form.businessName.trim()) return toast.error("Business name required");
    if (!form.categoryId) return toast.error("Please select a category");
    if (!form.priceMin || !form.priceMax) return toast.error("Please set price range");
    if (!form.address || !form.city) return toast.error("Please enter address");
    if (!latitude || !longitude) return toast.error("Please enable location");
    setLoading(true);
    const token = localStorage.getItem("auth_token");
    try {
      const res = await axios.post("/api/providers", { ...form, priceMin: Number(form.priceMin), priceMax: Number(form.priceMax), latitude, longitude }, { headers: { Authorization: `Bearer ${token}` } });
      setUser({ ...user!, provider: res.data.provider } as any);
      toast.success(t("registration_success"));
      router.replace("/provide/dashboard");
    } catch (err: any) { toast.error(err.response?.data?.message || "Registration failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav showBack onBack={() => router.back()} title={t("register_as_provider")} />
      <div className="p-4 pb-32 space-y-5 max-w-lg mx-auto">
        <div className={`p-4 rounded-2xl ${freeSlots > 0 ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
          {freeSlots > 0 ? <><p className="font-bold text-emerald-700">🎉 {t("first_50_free")}</p><p className="text-sm text-emerald-600"><strong>{freeSlots}</strong> {t("slots_remaining")}</p></> : <p className="font-bold text-amber-700">💳 {t("pay_to_list")}</p>}
        </div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-2">{t("business_name")} *</label><input type="text" value={form.businessName} onChange={e => setForm({...form, businessName: e.target.value})} placeholder="e.g., Sharma Plumbing Services" className="input-field" /></div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t("select_category")} *</label>
          <div className="grid grid-cols-3 gap-2">{categories.map(cat => (<button key={cat.id} type="button" onClick={() => setForm({...form, categoryId: cat.id})} className={`p-3 rounded-2xl border-2 text-center transition-all ${form.categoryId === cat.id ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}><div className="text-2xl mb-1">{cat.icon}</div><div className="text-xs font-semibold line-clamp-1">{cat.name}</div></button>))}</div>
        </div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-2">{t("description")}</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe your services..." rows={3} className="input-field resize-none" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">{t("min_price")}</label><input type="number" value={form.priceMin} onChange={e => setForm({...form, priceMin: e.target.value})} placeholder="100" className="input-field" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">{t("max_price")}</label><input type="number" value={form.priceMax} onChange={e => setForm({...form, priceMax: e.target.value})} placeholder="500" className="input-field" /></div>
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">📍 {t("location")} *</label>
          <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Street Address" className="input-field" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="City" className="input-field" />
            <input type="text" value={form.state} onChange={e => setForm({...form, state: e.target.value})} placeholder="State" className="input-field" />
          </div>
          <input type="text" value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} placeholder="Pincode" className="input-field" maxLength={6} />
          <button type="button" onClick={() => navigator.geolocation?.getCurrentPosition((pos) => setLocation(pos.coords.latitude, pos.coords.longitude))} className="btn-secondary w-full text-sm py-2.5">📍 Use My Current Location</button>
          {latitude && longitude && <p className="text-xs text-emerald-600 text-center">✓ Location captured!</p>}
        </div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-2">{t("whatsapp_number")}</label><input type="tel" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} placeholder="+91 9876543210" className="input-field" /></div>
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200">
          <div><p className="font-semibold text-gray-800 text-sm">Allow Multiple Bookings</p><p className="text-xs text-gray-500">For tutors, tailors, tiffin services</p></div>
          <button type="button" onClick={() => setForm({...form, allowMultiple: !form.allowMultiple})} className={`relative w-12 h-6 rounded-full transition-colors ${form.allowMultiple ? "bg-blue-500" : "bg-gray-300"}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.allowMultiple ? "translate-x-6" : ""}`} /></button>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full">{loading ? "Submitting..." : "Submit for Approval"}</button>
      </div>
    </div>
  );
}
