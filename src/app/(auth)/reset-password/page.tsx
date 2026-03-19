"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";

function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (!password || !confirm) { toast.error("Fill in all fields"); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (!token) { toast.error("Invalid reset link"); return; }
    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", { token, password });
      setDone(true);
      toast.success("Password reset successfully!");
      setTimeout(() => router.replace("/login"), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to reset password");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">LS</div>
          <span className="font-bold">LocalServices</span>
        </Link>
      </header>
      <main className="flex-1 flex flex-col justify-center px-6 pb-8 max-w-sm mx-auto w-full">
        {!done ? (
          <div className="animate-slide-up">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl">🔐</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
              <p className="text-gray-500 text-sm">Enter your new password</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" className="input-field" onKeyDown={(e) => e.key === "Enter" && handleReset()} />
              </div>
              <button onClick={handleReset} disabled={loading} className="btn-primary w-full">
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center animate-slide-up">
            <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h1>
            <p className="text-gray-500 text-sm">Redirecting to login...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ResetPasswordWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}