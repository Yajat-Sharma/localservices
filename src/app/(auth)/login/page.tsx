"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from "@/lib/firebase";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import axios from "axios";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");

  // Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone login state
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
    setToken(token);
    setUser(user);
    if (user.role === "ADMIN") router.replace("/admin");
    else if (!user.name) router.replace("/register?step=name");
    else if (user.role === "PROVIDER") router.replace("/provide/dashboard");
    else router.replace("/hire");
  };

  // Email login
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

  // Phone OTP
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
    setLoading(true);
    clearRecaptcha();
    try {
      const verifier = new RecaptchaVerifier(auth, recaptchaRef.current!, {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => { clearRecaptcha(); },
      });
      (window as any).recaptchaVerifier = verifier;
      await verifier.render();
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, verifier);
      setConfirmationResult(result);
      setStep("otp");
      setCountdown(60);
      toast.success(t("otp_sent"));
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
      clearRecaptcha();
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
    } catch {
      toast.error(t("invalid_otp"));
    } finally { setLoading(false); }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value.slice(-1); setOtp(newOtp);
    if (value && index < 5) document.getElementById(`login-otp-${index+1}`)?.focus();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div ref={recaptchaRef} />
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">LS</div>
          <span className="font-bold">LocalServices</span>
        </Link>
        <LanguageSwitcher />
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 pb-8 max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("login")}</h1>
          <p className="text-gray-500 text-sm">Welcome back to LocalServices</p>
        </div>

        {/* Login method tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          <button
            onClick={() => setLoginMethod("email")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${loginMethod === "email" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            📧 Email
          </button>
          <button
            onClick={() => setLoginMethod("phone")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${loginMethod === "phone" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            📱 Phone OTP
          </button>
        </div>

        {/* Email Login */}
        {loginMethod === "email" && (
          <div className="animate-slide-up space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
                onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
              />
            </div>
            <button onClick={handleEmailLogin} disabled={loading} className="btn-primary w-full">
              {loading ? "Logging in..." : t("login")}
            </button>
          </div>
        )}

        {/* Phone OTP Login */}
        {loginMethod === "phone" && (
          <div className="animate-slide-up">
            {step === "phone" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("phone_number")}</label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium">🇮🇳 +91</div>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g,""))} placeholder="9876543210" maxLength={10} className="input-field flex-1" />
                  </div>
                </div>
                <button onClick={handleSendOtp} disabled={loading || phone.length < 10} className="btn-primary w-full">
                  {loading ? "Sending..." : t("send_otp")}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-500 text-sm text-center">OTP sent to +91 {phone}</p>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <input key={i} id={`login-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`login-otp-${i-1}`)?.focus(); }}
                      className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-2xl focus:outline-none transition-all ${digit ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50"}`}
                    />
                  ))}
                </div>
                <button onClick={handleVerifyOtp} disabled={loading || otp.join("").length < 6} className="btn-primary w-full">
                  {loading ? "Verifying..." : t("verify_otp")}
                </button>
                <button onClick={handleSendOtp} disabled={countdown > 0} className="w-full text-sm text-gray-500 py-2">
                  {countdown > 0 ? `Resend in ${countdown}s` : t("resend_otp")}
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-center mt-6 text-sm text-gray-500">
          Don't have an account?{" "}
          <Link href="/register" className="text-blue-600 font-semibold">{t("signup")}</Link>
        </p>
      </main>
    </div>
  );
}