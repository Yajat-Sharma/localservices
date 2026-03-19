"use client";
import { useState } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import axios from "axios";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) { toast.error("Enter your email"); return; }
    setLoading(true);
    try {
      await axios.post("/api/auth/forgot-password", { email });
      setSent(true);
      toast.success("Reset link sent!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send reset email");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">LS</div>
          <span className="font-bold">LocalServices</span>
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="flex-1 flex flex-col justify-center px-6 pb-8 max-w-sm mx-auto w-full">
        {!sent ? (
          <div className="animate-slide-up">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl">🔑</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
              <p className="text-gray-500 text-sm">Enter your email and we'll send you a reset link</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <Link href="/login" className="block text-center text-sm text-blue-600 font-medium">
                ← Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center animate-slide-up">
            <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl">📧</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email!</h1>
            <p className="text-gray-500 text-sm mb-6">We sent a reset link to <strong>{email}</strong></p>
            <p className="text-xs text-gray-400 mb-6">Link expires in 1 hour. Check spam if not received.</p>
            <Link href="/login" className="btn-primary w-full block text-center">
              Back to Login
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}