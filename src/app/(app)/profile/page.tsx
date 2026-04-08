"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { TopNav } from "@/components/shared/TopNav";
import { useAuthStore } from "@/lib/store";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import axios from "axios";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [newPhone, setNewPhone] = useState("");
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
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setUploadingAvatar(true);
    const token = localStorage.getItem("auth_token");
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await axios.post("/api/users/avatar", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setUser({ ...user!, avatar: res.data.avatarUrl });
      toast.success("Photo updated!");
    } catch { toast.error("Upload failed"); }
    finally { setUploadingAvatar(false); }
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name required"); return; }
    if (newPhone && newPhone.length !== 10) { toast.error("Enter valid 10-digit number"); return; }
    setLoading(true);
    const token = localStorage.getItem("auth_token");
    try {
      const updateData: any = { name };
      if (newPhone) updateData.phone = `+91${newPhone}`;
      const res = await axios.patch("/api/users/me", updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser({ ...user!, name: res.data.user.name, phone: res.data.user.phone });
      if (newPhone) setNewPhone("");
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    } finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <TopNav showBack onBack={() => router.back()} title="My Profile" />
      <div className="p-4 max-w-lg mx-auto space-y-4 pb-10 animate-fade-in">

        {/* ── Avatar Card ── */}
        <div className="card p-6 text-center">
          <div className="relative inline-block mb-4">
            {/* Avatar circle */}
            <div className="w-24 h-24 rounded-3xl overflow-hidden mx-auto"
              style={{ boxShadow: "0 8px 32px rgba(124,58,237,0.3)", background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
              {user.avatar ? (
                <Image src={user.avatar} alt="Avatar" width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-3xl font-black">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>

            {/* Camera button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              {uploadingAvatar ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>

          <h2 className="font-black text-xl" style={{ color: "var(--text-primary)" }}>
            {user.name || "Your Name"}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {user.email || user.phone || "No contact info"}
          </p>
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full text-xs font-bold"
            style={user.role === "ADMIN"
              ? { background: "rgba(124,58,237,0.1)", color: "#7c3aed" }
              : user.role === "PROVIDER"
              ? { background: "rgba(16,185,129,0.1)", color: "#059669" }
              : { background: "rgba(236,72,153,0.1)", color: "#ec4899" }}>
            {user.role === "ADMIN" ? "👑 Admin" : user.role === "PROVIDER" ? "🏪 Provider" : "👤 Customer"}
          </span>
        </div>

        {/* ── Edit Info Card ── */}
        <div className="card p-4">
          <h3 className="font-black text-base mb-4" style={{ color: "var(--text-primary)" }}>
            Personal Info
          </h3>
          <div className="space-y-4">

            {/* Name field */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your full name"
                className="input-field"
              />
            </div>

            {/* Email field — always readonly */}
            {user.email && (
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Email
                  <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                    (cannot be changed)
                  </span>
                </label>
                <div className="input-field flex items-center gap-2 cursor-not-allowed"
                  style={{ opacity: 0.6 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span className="text-sm">{user.email}</span>
                </div>
              </div>
            )}

            {/* Phone field */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Phone Number
                {/* Show "Add phone" hint only if no phone */}
                {!user.phone && (
                  <span className="ml-2 text-xs font-bold gradient-text">
                    + Add to enable OTP login
                  </span>
                )}
              </label>

              {/* If phone EXISTS → show readonly */}
              {user.phone ? (
                <div className="input-field flex items-center gap-2 cursor-not-allowed"
                  style={{ opacity: 0.6 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.35 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.83-1.83a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span className="text-sm">{user.phone}</span>
                </div>
              ) : (
                /* If NO phone → show editable input */
                <div>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 rounded-2xl text-sm font-bold flex-shrink-0"
                      style={{
                        background: "var(--bg-input)",
                        border: "1.5px solid var(--border-input)",
                        color: "var(--text-primary)",
                        height: "52px"
                      }}>
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      maxLength={10}
                      className="input-field flex-1"
                    />
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                    Adding your phone lets you sign in with OTP in the future
                  </p>
                </div>
              )}
            </div>

            {/* Save button */}
            <button onClick={handleSave} disabled={loading} className="btn-primary w-full py-4">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : "Save Changes"}
            </button>
          </div>
        </div>

        {/* ── Appearance Card ── */}
        <div className="card p-4">
          <h3 className="font-black text-base mb-3" style={{ color: "var(--text-primary)" }}>
            Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Theme</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Light, dark or system default
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* ── Account Info Card ── */}
        <div className="card p-4">
          <h3 className="font-black text-base mb-3" style={{ color: "var(--text-primary)" }}>
            Account Details
          </h3>
          <div className="space-y-2">
            {[
              { label: "Role",          value: user.role,    gradient: true },
              { label: "Login Method",  value: user.phone ? "Phone OTP" : "Email & Password" },
              { label: "App Version",   value: "1.0.0" },
            ].map((item, i, arr) => (
              <div key={item.label}
                className="flex items-center justify-between py-2.5"
                style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                <span className={`text-sm font-bold ${item.gradient ? "gradient-text" : ""}`}
                  style={!item.gradient ? { color: "var(--text-primary)" } : {}}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}