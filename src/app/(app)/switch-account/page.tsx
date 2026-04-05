"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { useAuthStore, useLocationStore } from "@/lib/store";
import axios from "axios";
import toast from "react-hot-toast";

export default function SwitchAccountPage() {
  const { user, setUser, setToken } = useAuthStore();
  const { latitude, longitude } = useLocationStore();
  const router = useRouter();
  const [step, setStep] = useState<"choose" | "register" | "pending">("choose");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [providerStatus, setProviderStatus] = useState<any>(null);

  const [form, setForm] = useState({
    businessName: "", categoryId: "", description: "",
    priceMin: "", priceMax: "", serviceRadius: "5",
    address: "", city: "", state: "", pincode: "",
    whatsapp: "", allowMultiple: false,
  });

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    fetchCategories();
    checkProviderStatus();
  }, [user]);

  const fetchCategories = async () => {
    const res = await axios.get("/api/categories");
    setCategories(res.data.categories);
  };

  const checkProviderStatus = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const res = await axios.get("/api/providers/me/details", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProviderStatus(res.data.provider);
    } catch {}
  };

  const handleSwitchRole = async (role: string) => {
    setLoading(true);
    const token = localStorage.getItem("auth_token");
    try {
      const res = await axios.post("/api/users/switch-role", { role }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.setItem("auth_token", res.data.token);
      document.cookie = `auth_token=${res.data.token}; path=/; max-age=${30 * 24 * 60 * 60}`;
      setToken(res.data.token);
      setUser(res.data.user);
      toast.success(`Switched to ${role} account!`);
      if (role === "PROVIDER") router.replace("/provide/dashboard");
      else if (role === "ADMIN") router.replace("/admin");
      else router.replace("/hire");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to switch");
    } finally { setLoading(false); }
  };

  const handleBecomeProvider = async () => {
    if (!form.businessName || !form.categoryId || !form.priceMin || !form.priceMax || !form.address || !form.city || !form.pincode) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    const token = localStorage.getItem("auth_token");
    try {
      await axios.post("/api/users/become-provider", {
        ...form,
        latitude: latitude || 19.076,
        longitude: longitude || 72.877,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Provider profile created! Awaiting admin approval.");
      setStep("pending");
      checkProviderStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to register");
    } finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <TopNav showBack onBack={() => router.back()} title="Switch Account" />
      <div className="p-4 pb-8 max-w-lg mx-auto space-y-4 animate-fade-in">

        {/* Current Account */}
        <div className="card p-4"
          style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(79,70,229,0.06))", border: "1px solid rgba(37,99,235,0.15)" }}>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">CURRENT ACCOUNT</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)" }}>
              {user.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{user.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email || user.phone}</p>
              <span className={`tag mt-1 inline-flex ${
                user.role === "ADMIN" ? "tag-blue" :
                user.role === "PROVIDER" ? "tag-green" : "tag-orange"
              }`}>
                {user.role === "ADMIN" ? "Admin" :
                 user.role === "PROVIDER" ? "Provider" : "Customer"}
              </span>
            </div>
          </div>
        </div>

        {step === "choose" && (
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Switch to</h3>

            {/* Switch to Customer */}
            {user.role !== "CUSTOMER" && (
              <button
                onClick={() => handleSwitchRole("CUSTOMER")}
                disabled={loading}
                className="w-full card p-4 text-left hover:shadow-md transition-all active:scale-98 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 dark:text-white">Customer Account</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Browse and book local services</p>
                    <div className="flex gap-1.5 mt-2">
                      {["Book services", "Chat with providers", "Track bookings"].map(f => (
                        <span key={f} className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">{f}</span>
                      ))}
                    </div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400 flex-shrink-0">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </button>
            )}

            {/* Switch to Provider */}
            {user.role !== "PROVIDER" && (
              <button
                onClick={() => {
                  if (providerStatus?.isApproved) {
                    handleSwitchRole("PROVIDER");
                  } else if (providerStatus && !providerStatus.isApproved) {
                    setStep("pending");
                  } else {
                    setStep("register");
                  }
                }}
                disabled={loading}
                className="w-full card p-4 text-left hover:shadow-md transition-all active:scale-98 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 dark:text-white">Business Account</p>
                      {providerStatus && !providerStatus.isApproved && (
                        <span className="tag tag-orange text-xs">Pending</span>
                      )}
                      {providerStatus?.isApproved && (
                        <span className="tag tag-green text-xs">Approved</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {providerStatus?.isApproved
                        ? "Your business account is ready!"
                        : providerStatus
                        ? "Awaiting admin approval"
                        : "Offer your services to customers"}
                    </p>
                    <div className="flex gap-1.5 mt-2">
                      {["Earn money", "Manage bookings", "Build reputation"].map(f => (
                        <span key={f} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">{f}</span>
                      ))}
                    </div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400 flex-shrink-0">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </button>
            )}

            {/* Admin switch options */}
            {user.role === "ADMIN" && (
              <div className="card p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">ADMIN QUICK SWITCH</p>
                <div className="grid grid-cols-2 gap-2">
                  {["CUSTOMER", "PROVIDER"].map(role => (
                    <button
                      key={role}
                      onClick={() => handleSwitchRole(role)}
                      disabled={loading}
                      className="py-3 rounded-2xl text-sm font-semibold transition-all bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      Switch to {role === "CUSTOMER" ? "Customer" : "Provider"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Provider Registration Form */}
        {step === "register" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("choose")}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Register as Provider</h3>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-2">
              {["Business Info", "Pricing", "Location"].map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-slate-700 text-gray-500"
                  }`}>{i + 1}</div>
                  <span className="text-xs text-gray-500 truncate">{s}</span>
                  {i < 2 && <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />}
                </div>
              ))}
            </div>

            <div className="card p-4 space-y-4">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">Business Information</h4>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={e => setForm({...form, businessName: e.target.value})}
                  placeholder="e.g. Sharma Electricals"
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                  Service Category *
                </label>
                <select
                  value={form.categoryId}
                  onChange={e => setForm({...form, categoryId: e.target.value})}
                  className="input-field"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Describe your services and experience..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={e => setForm({...form, whatsapp: e.target.value})}
                  placeholder="+91 9876543210"
                  className="input-field"
                />
              </div>
            </div>

            <div className="card p-4 space-y-4">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">Pricing</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">Min Price (₹) *</label>
                  <input type="number" value={form.priceMin}
                    onChange={e => setForm({...form, priceMin: e.target.value})}
                    placeholder="200" className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">Max Price (₹) *</label>
                  <input type="number" value={form.priceMax}
                    onChange={e => setForm({...form, priceMax: e.target.value})}
                    placeholder="1000" className="input-field" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                  Service Radius: <span className="text-blue-600">{form.serviceRadius}km</span>
                </label>
                <input type="range" min="1" max="20" value={form.serviceRadius}
                  onChange={e => setForm({...form, serviceRadius: e.target.value})}
                  className="w-full accent-blue-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-2xl">
                <div>
                  <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">Allow Multiple Bookings</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">For tutors, tailors, tiffin services</p>
                </div>
                <button
                  onClick={() => setForm({...form, allowMultiple: !form.allowMultiple})}
                  className={`relative w-12 h-6 rounded-full transition-colors ${form.allowMultiple ? "bg-blue-500" : "bg-gray-300 dark:bg-slate-600"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.allowMultiple ? "translate-x-6" : ""}`} />
                </button>
              </div>
            </div>

            <div className="card p-4 space-y-4">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">Location</h4>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">Address *</label>
                <input type="text" value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  placeholder="Street address" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">City *</label>
                  <input type="text" value={form.city}
                    onChange={e => setForm({...form, city: e.target.value})}
                    placeholder="Mumbai" className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">State</label>
                  <input type="text" value={form.state}
                    onChange={e => setForm({...form, state: e.target.value})}
                    placeholder="Maharashtra" className="input-field" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">Pincode *</label>
                <input type="text" value={form.pincode}
                  onChange={e => setForm({...form, pincode: e.target.value})}
                  placeholder="400001" className="input-field" />
              </div>
            </div>

            <button
              onClick={handleBecomeProvider}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
              ) : (
                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Submit for Approval</>
              )}
            </button>
          </div>
        )}

        {/* Pending Approval */}
        {step === "pending" && (
          <div className="card p-8 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">Pending Approval</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4">
              Your business profile has been submitted! Our admin team will review and approve it within 24 hours.
            </p>
            {providerStatus && (
              <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 text-left mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Business</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{providerStatus.businessName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Category</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{providerStatus.category?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <span className="tag tag-orange">Pending Review</span>
                </div>
              </div>
            )}
            <button onClick={() => setStep("choose")} className="btn-secondary w-full">
              Back to Account Options
            </button>
          </div>
        )}
      </div>
    </div>
  );
}