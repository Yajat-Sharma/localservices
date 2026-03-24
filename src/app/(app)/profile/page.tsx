"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { TopNav } from "@/components/shared/TopNav";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import axios from "axios";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    setName(user.name || "");
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File too large. Max 5MB"); return; }

    setUploadingAvatar(true);
    const token = localStorage.getItem("auth_token");
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await axios.post("/api/users/avatar", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setUser({ ...user!, avatar: res.data.avatarUrl });
      toast.success("Profile photo updated!");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name cannot be empty"); return; }
    setLoading(true);
    const token = localStorage.getItem("auth_token");
    try {
      const res = await axios.patch("/api/users/me", { name }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser({ ...user!, name: res.data.user.name });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <TopNav showBack onBack={() => router.back()} title="My Profile" />
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in pb-8">

        {/* Avatar Section */}
        <div className="card p-6 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-3xl overflow-hidden mx-auto"
              style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)", boxShadow: "0 8px 24px rgba(37,99,235,0.3)" }}>
              {user.avatar ? (
                <Image src={user.avatar} alt="Avatar" width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110"
              style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)" }}
            >
              {uploadingAvatar ? (
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <h2 className="font-bold text-xl text-gray-900 dark:text-white">{user.name || "Your Name"}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email || user.phone}</p>
          <span className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
            user.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
            user.role === "PROVIDER" ? "bg-blue-100 text-blue-700" :
            "bg-emerald-100 text-emerald-700"
          }`}>
            {user.role === "ADMIN" ? "Admin" : user.role === "PROVIDER" ? "Provider" : "Customer"}
          </span>
        </div>

        {/* Edit Name */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">Personal Info</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                className="input-field"
              />
            </div>
            {user.phone && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
                <input type="text" value={user.phone} disabled className="input-field opacity-60 cursor-not-allowed" />
              </div>
            )}
            {user.email && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input type="email" value={user.email} disabled className="input-field opacity-60 cursor-not-allowed" />
              </div>
            )}
            <button onClick={handleSave} disabled={loading} className="btn-primary w-full">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">Theme</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Light, dark or system default</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}