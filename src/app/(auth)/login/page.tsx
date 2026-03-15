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
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["","","","","",""]);
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => { if (countdown > 0) { const timer = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(timer); } }, [countdown]);

  const setupRecaptcha = () => {
  try {
    if ((window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier.clear();
      (window as any).recaptchaVerifier = null;
    }
  } catch {}
  
  (window as any).recaptchaVerifier = new RecaptchaVerifier(
    auth,
    "recaptcha-container",
    {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {
        (window as any).recaptchaVerifier = null;
      },
    }
  );
};

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) { toast.error("Enter valid phone"); return; }
    setLoading(true);
    try {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
      (window as any).recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {},
          "expired-callback": () => {
            (window as any).recaptchaVerifier = null;
          },
        }
      );
      await (window as any).recaptchaVerifier.render();
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, (window as any).recaptchaVerifier);
      setConfirmationResult(result); setStep("otp"); setCountdown(60); toast.success(t("otp_sent"));
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    const otpStr = otp.join("");
    if (otpStr.length !== 6) return;
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otpStr);
      const firebaseToken = await result.user.getIdToken();
      const res = await axios.post("/api/auth/login", { firebaseToken, phone: result.user.phoneNumber });
      const { token, user } = res.data;
      localStorage.setItem("auth_token", token);
      document.cookie = `auth_token=${token}; path=/; max-age=${30*24*60*60}`;
      setToken(token); setUser(user);
      if (user.role === "ADMIN") router.replace("/admin");
      else if (!user.name) router.replace("/register?step=name");
      else if (user.role === "PROVIDER") router.replace("/provide/dashboard");
      else router.replace("/hire");
    } catch { toast.error(t("invalid_otp")); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value.slice(-1); setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index+1}`)?.focus();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div id="recaptcha-container" />
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2"><div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">LS</div><span className="font-bold text-gray-900">LocalServices</span></Link>
        <LanguageSwitcher />
      </header>
      <main className="flex-1 flex flex-col justify-center px-6 pb-8 max-w-sm mx-auto w-full">
        {step === "phone" ? (
          <div className="animate-slide-up">
            <div className="text-center mb-8"><div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl">📱</div><h1 className="text-2xl font-bold text-gray-900 mb-2">{t("login")}</h1><p className="text-gray-500 text-sm">Enter your phone number to continue</p></div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t("phone_number")}</label>
            <div className="flex gap-2 mb-4">
              <div className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium">🇮🇳 +91</div>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g,""))} placeholder="9876543210" maxLength={10} className="input-field flex-1" onKeyDown={(e) => e.key === "Enter" && handleSendOtp()} />
            </div>
            <button onClick={handleSendOtp} disabled={loading || phone.length < 10} className="btn-primary w-full">{loading ? "Sending..." : t("send_otp")}</button>
            <p className="text-center mt-6 text-sm text-gray-500">Don&apos;t have an account? <Link href="/register" className="text-blue-600 font-semibold">{t("signup")}</Link></p>
          </div>
        ) : (
          <div className="animate-slide-up">
            <div className="text-center mb-8"><div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl">🔐</div><h1 className="text-2xl font-bold text-gray-900 mb-2">{t("verify_otp")}</h1><p className="text-gray-500 text-sm">OTP sent to +91 {phone} <button onClick={() => setStep("phone")} className="ml-2 text-blue-600 font-medium text-xs">Edit</button></p></div>
            <div className="flex gap-2 justify-center mb-6">
              {otp.map((digit, i) => (
                <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`otp-${i-1}`)?.focus(); }}
                  className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${digit ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50"}`} />
              ))}
            </div>
            <button onClick={handleVerifyOtp} disabled={loading || otp.join("").length < 6} className="btn-primary w-full mb-4">{loading ? "Verifying..." : t("verify_otp")}</button>
            <button onClick={handleSendOtp} disabled={countdown > 0} className="w-full text-sm text-gray-500 py-2">{countdown > 0 ? `Resend in ${countdown}s` : t("resend_otp")}</button>
          </div>
        )}
      </main>
    </div>
  );
}
