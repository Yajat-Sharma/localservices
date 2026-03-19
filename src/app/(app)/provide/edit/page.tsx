"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";
import axios from "axios";
import toast from "react-hot-toast";

export default function ProviderEditPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    description: "",
    priceMin: "",
    priceMax: "",
    whatsapp: "",
    allowMultiple: false,
  });

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    if (!user.provider) { router.replace("/provide/register"); return; }
    const p = user.provider as any;
    setForm({
      description: p.description || "",
      priceMin: String(p.priceMin || ""),
      priceMax: String(p.priceMax || ""),
      whatsapp: p.whatsapp || "",
      allowMultiple: p.allowMultiple || false,
    });
  }, [user]);

  const handleSave = async () => {
    if (!form.priceMin || !form.priceMax) {
      toast.error("Please set price range");
      return;
    }
    setLoading(true);
    const token = localStorage.getItem("auth_token");
    try {
      const res = await axios.patch("/api/providers/me", {
        description: form.description,
        priceMin: Number(form.priceMin),
        priceMax: Number(form.priceMax),
        whatsapp: form.whatsapp,
        allowMultiple: form.allowMultiple,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setUser({ ...user!, provider: { ...user!.provider!, ...res.data.provider } } as any);
      toast.success("Profile updated!");
      router.replace("/provide/dashboard");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user?.provider) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav showBack onBack={() => router.back()} title="Edit Profile" />
      <div className="p-4 pb-32 space-y-5 max-w-lg mx-auto animate-fade-in">

        {/* Business info (read only) */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-900 mb-3">Business Info</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Business Name</span>
              <span className="font-medium">{(user.provider as any).businessName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Category</span>
              <span className="font-medium">{(user.provider as any).category?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className={`tag ${(user.provider as any).isApproved ? "tag-green" : "tag-orange"}`}>
                {(user.provider as any).isApproved ? "✓ Approved" : "⏳ Pending"}
              </span>
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
            placeholder="Describe your services, experience..."
            rows={4}
            className="input-field resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Min Price (₹)</label>
            <input
              type="number"
              value={form.priceMin}
              onChange={e => setForm({...form, priceMin: e.target.value})}
              placeholder="100"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Max Price (₹)</label>
            <input
              type="number"
              value={form.priceMax}
              onChange={e => setForm({...form, priceMax: e.target.value})}
              placeholder="500"
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp Number</label>
          <input
            type="tel"
            value={form.whatsapp}
            onChange={e => setForm({...form, whatsapp: e.target.value})}
            placeholder="+91 9876543210"
            className="input-field"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200">
          <div>
            <p className="font-semibold text-gray-800 text-sm">Allow Multiple Bookings</p>
            <p className="text-xs text-gray-500 mt-0.5">For tutors, tailors, tiffin services</p>
          </div>
          <button
            type="button"
            onClick={() => setForm({...form, allowMultiple: !form.allowMultiple})}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.allowMultiple ? "bg-blue-500" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.allowMultiple ? "translate-x-6" : ""}`} />
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <button onClick={handleSave} disabled={loading} className="btn-primary w-full">
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}