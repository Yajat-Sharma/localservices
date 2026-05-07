"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, RecaptchaVerifier, signInWithPhoneNumber, googleProvider, signInWithPopup } from "@/lib/firebase";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import axios from "axios";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["","","","","",""]);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const saveSession = (token: string, user: any) => {
    localStorage.setItem("auth_token", token);
    document.cookie = `auth_token=${token}; path=/; max-age=${30*24*60*60}`;
    setToken(token); setUser(user);
    if (user.role === "ADMIN") router.replace("/admin");
    else if (!user.name) router.replace("/register?step=name");
    else if (user.role === "PROVIDER") router.replace("/provide/dashboard");
    else router.replace("/hire");
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseToken = await result.user.getIdToken();
      const res = await axios.post("/api/auth/google", { firebaseToken });
      saveSession(res.data.token, res.data.user);
      toast.success("Welcome to LocalServices!");
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error(err.response?.data?.error || "Google sign-in failed");
      }
    } finally { setLoading(false); }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) { toast.error("Enter email and password"); return; }
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/email-login", { email, password });
      saveSession(res.data.token, res.data.user);
      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid email or password");
    } finally { setLoading(false); }
  };

  const clearRecaptcha = () => {
    try {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    } catch {}
    if (recaptchaRef.current) recaptchaRef.current.innerHTML = "";
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) { toast.error("Enter valid phone number"); return; }
    setLoading(true); clearRecaptcha();
    try {
      const verifier = new RecaptchaVerifier(auth, recaptchaRef.current!, {
        size: "invisible", callback: () => {}, "expired-callback": () => { clearRecaptcha(); }
      });
      (window as any).recaptchaVerifier = verifier;
      await verifier.render();
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, verifier);
      setConfirmationResult(result); setStep("otp"); setCountdown(60);
      toast.success(t("otp_sent"));
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP"); clearRecaptcha();
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    const otpStr = otp.join("");
    if (otpStr.length !== 6) return;
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otpStr);
      const firebaseToken = await result.user.getIdToken();
      const res = await axios.post("/api/auth/login", { firebaseToken, phone: result.user.phoneNumber });
      saveSession(res.data.token, res.data.user);
    } catch { toast.error(t("invalid_otp")); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value.slice(-1); setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index+1}`)?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <div ref={recaptchaRef} />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", boxShadow: "0 4px 12px rgba(124,58,237,0.35)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span className="font-black text-lg" style={{ color: "var(--text-primary)" }}>
            Local<span className="gradient-text">Services</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {/* ✅ Full language switcher on auth pages */}
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 pb-10 max-w-sm mx-auto w-full animate-fade-in">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-black tracking-tight mb-2"
            style={{ color: "var(--text-primary)" }}>
            {t("login")}
          </h1>
          <p className="gradient-text font-semibold">Welcome back to LocalServices</p>
        </div>

        {/* Method Tabs */}
        <div className="flex p-1 rounded-2xl mb-6"
          style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.12)" }}>
          {[
            { key: "email", label: "📧 Email" },
            { key: "phone", label: "📱 Phone OTP" },
          ].map(m => (
            <button key={m.key} onClick={() => setLoginMethod(m.key as any)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={loginMethod === m.key ? {
                background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                color: "white",
                boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
              } : { color: "var(--text-muted)" }}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Email Login */}
        {loginMethod === "email" && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-sm font-semibold mb-2"
                style={{ color: "var(--text-secondary)" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
                onKeyDown={e => e.key === "Enter" && handleEmailLogin()}
                style={{ color: "var(--text-input)", background: "var(--bg-input)" }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                  Password
                </label>
                <Link href="/forgot-password"
                  className="text-xs font-semibold gradient-text hover:opacity-80">
                  Forgot password?
                </Link>
              </div>
              {/* ✅ Password field with explicit visible text */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pr-12 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  onKeyDown={e => e.key === "Enter" && handleEmailLogin()}
                  style={{
                    color: "var(--text-input)",
                    background: "var(--bg-input)",
                    WebkitTextFillColor: "var(--text-input)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button onClick={handleEmailLogin} disabled={loading} className="btn-primary w-full py-4 text-base">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : t("login")}
            </button>
          </div>
        )}

        {/* Phone OTP */}
        {loginMethod === "phone" && (
          <div className="animate-fade-in">
            {step === "phone" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2"
                    style={{ color: "var(--text-secondary)" }}>{t("phone_number")}</label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-4 rounded-2xl text-sm font-bold flex-shrink-0"
                      style={{ background: "var(--bg-input)", border: "1.5px solid var(--border-input)", color: "var(--text-primary)" }}>
                      🇮🇳 +91
                    </div>
                    <input type="tel" value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210" maxLength={10}
                      className="input-field flex-1 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                      style={{ color: "var(--text-input)", background: "var(--bg-input)" }}
                    />
                  </div>
                </div>
                <button onClick={handleSendOtp} disabled={loading || phone.length < 10} className="btn-primary w-full py-4">
                  {loading ? "Sending..." : t("send_otp")}
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                  Code sent to{" "}
                  <span className="font-bold" style={{ color: "var(--text-primary)" }}>+91 {phone}</span>
                </p>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <input key={i} id={`otp-${i}`} type="text" inputMode="numeric"
                      maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => { if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`otp-${i-1}`)?.focus(); }}
                      className="w-12 h-14 text-center text-xl font-black rounded-2xl focus:outline-none transition-all"
                      style={{
                        border: digit ? "2px solid #7c3aed" : "1.5px solid var(--border-input)",
                        background: digit ? "rgba(124,58,237,0.06)" : "var(--bg-input)",
                        color: "var(--text-input)",
                        boxShadow: digit ? "0 0 0 3px rgba(124,58,237,0.12)" : "none",
                      }}
                    />
                  ))}
                </div>
                <button onClick={handleVerifyOtp} disabled={loading || otp.join("").length < 6} className="btn-primary w-full py-4">
                  {loading ? "Verifying..." : t("verify_otp")}
                </button>
                <button onClick={handleSendOtp} disabled={countdown > 0}
                  className="w-full text-sm py-2 font-semibold transition-colors"
                  style={{ color: countdown > 0 ? "var(--text-muted)" : "#7c3aed" }}>
                  {countdown > 0 ? `Resend in ${countdown}s` : t("resend_otp")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>or continue with</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* ── Google Button ── */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: "var(--bg-card)",
            border: "1.5px solid var(--border)",
            color: "var(--text-primary)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          {/* Official Google G logo */}
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center mt-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
          <Link href="/register" className="font-bold gradient-text">
            {t("signup")}
          </Link>
        </p>
      </main>
    </div>
  );
}