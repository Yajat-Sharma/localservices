"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { auth, RecaptchaVerifier, signInWithPhoneNumber, googleProvider, signInWithPopup } from "@/lib/firebase";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import axios from "axios";
import toast from "react-hot-toast";

function RegisterPage() {
  const [regMethod, setRegMethod] = useState<"email" | "phone">("email");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setToken, user } = useAuthStore();
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["","","","","",""]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [countdown, setCountdown] = useState(0);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (searchParams.get("step") === "name" && user) setStep("name"); }, [searchParams, user]);
  useEffect(() => { if (countdown > 0) { const timer = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(timer); } }, [countdown]);

  useEffect(() => {
    return () => {
      try {
        if ((window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        }
      } catch {}
    };
  }, []);

  const clearRecaptcha = () => {
    try {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    } catch {}
    if (recaptchaContainerRef.current) {
      recaptchaContainerRef.current.innerHTML = "";
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) { toast.error("Enter valid phone number"); return; }
    setLoading(true);
    clearRecaptcha();
    try {
      const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current!, {
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
      console.error("OTP error:", err);
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
      const { token, user: userData } = res.data;
      localStorage.setItem("auth_token", token);
      document.cookie = `auth_token=${token}; path=/; max-age=${30*24*60*60}`;
      setToken(token); setUser(userData); setStep("name");
    } catch (err: any) {
      console.error("Verify error:", err);
      toast.error(t("invalid_otp"));
    } finally { setLoading(false); }
  };

  const handleSaveName = async () => {
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    setLoading(true);
    const token = localStorage.getItem("auth_token");
    try {
      const res = await axios.patch("/api/auth/me", { name }, { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data.user); setStep("role");
    } catch { toast.error("Failed to save name"); }
    finally { setLoading(false); }
  };

  const handleRoleSelect = async (role: string) => {
    setLoading(true);
    const token = localStorage.getItem("auth_token");
    try {
      const res = await axios.patch("/api/auth/me", { role }, { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data.user);
      if (role === "PROVIDER") router.replace("/provide/register");
      else router.replace("/hire");
    } catch { toast.error("Failed to set role"); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value.slice(-1); setOtp(newOtp);
    if (value && index < 5) document.getElementById(`reg-otp-${index+1}`)?.focus();
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseToken = await result.user.getIdToken();
      const res = await axios.post("/api/auth/google", { firebaseToken });
      const { token, user: userData } = res.data;
      localStorage.setItem("auth_token", token);
      document.cookie = `auth_token=${token}; path=/; max-age=${30*24*60*60}`;
      setToken(token);
      setUser(userData);
      // If they already have a role set, skip straight to hire/provide
      if (userData.role === "PROVIDER") router.replace("/provide/dashboard");
      else if (userData.role === "CUSTOMER") router.replace("/hire");
      else setStep("role"); // new user — pick a role
      toast.success("Welcome to LocalServices!");
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error(err.response?.data?.error || "Google sign-up failed");
      }
    } finally { setLoading(false); }
  };

  const handleEmailRegister = async () => {
  if (!regName || !regEmail || !regPassword) { toast.error("All fields required"); return; }
  if (regPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
  setLoading(true);
  try {
    const res = await axios.post("/api/auth/register", {
      name: regName,
      email: regEmail,
      password: regPassword,
    });
    const { token, user: userData } = res.data;
    localStorage.setItem("auth_token", token);
    document.cookie = `auth_token=${token}; path=/; max-age=${30*24*60*60}`;
    setToken(token);
    setUser(userData);
    setStep("role");
    toast.success("Account created!");
  } catch (err: any) {
    toast.error(err.response?.data?.error || "Registration failed");
  } finally { setLoading(false); }
};

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div ref={recaptchaContainerRef} id="recaptcha-container" style={{ display: "none" }} />
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">LS</div>
          <span className="font-bold">LocalServices</span>
        </Link>
        <LanguageSwitcher compact />
      </header>
      <main className="flex-1 flex flex-col justify-center px-6 pb-8 max-w-sm mx-auto w-full animate-slide-up">
                {step === "phone" && (
          <>
            <h1 className="text-2xl font-bold mb-2">{t("signup")}</h1>
            <p className="text-gray-500 text-sm mb-6">Create your account</p>

            {/* Registration method tabs */}
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
              <button
                onClick={() => setRegMethod("email")}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${regMethod === "email" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                📧 Email
              </button>
              <button
                onClick={() => setRegMethod("phone")}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${regMethod === "phone" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                📱 Phone OTP
              </button>
            </div>

            {regMethod === "email" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Your full name" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="you@example.com" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Min 6 characters" className="input-field" />
                </div>
                <button onClick={handleEmailRegister} disabled={loading} className="btn-primary w-full">
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  <div className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium">🇮🇳 +91</div>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g,""))} placeholder="9876543210" maxLength={10} className="input-field flex-1 placeholder:text-gray-400 dark:placeholder:text-slate-500" onKeyDown={(e) => e.key === "Enter" && handleSendOtp()} />
                </div>
                <button onClick={handleSendOtp} disabled={loading || phone.length < 10} className="btn-primary w-full">
                  {loading ? "Sending..." : t("send_otp")}
                </button>
              </>
            )}
            {/* ── Divider ── */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-semibold text-gray-400">or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* ── Google Button ── */}
            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-200 rounded-2xl font-semibold text-sm text-gray-700 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <p className="text-center mt-6 text-sm text-gray-500">Already have an account? <Link href="/login" className="text-blue-600 font-semibold">{t("login")}</Link></p>
          </>
        )}
        {step === "otp" && (
          <>
            <h1 className="text-2xl font-bold mb-2">{t("verify_otp")}</h1>
            <p className="text-gray-500 text-sm mb-8">OTP sent to +91 {phone} <button onClick={() => setStep("phone")} className="ml-2 text-blue-600 text-xs font-medium">Edit</button></p>
            <div className="flex gap-2 justify-center mb-6">
              {otp.map((digit, i) => (
                <input key={i} id={`reg-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`reg-otp-${i-1}`)?.focus(); }}
                  className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-2xl focus:outline-none transition-all ${digit ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50"}`}
                />
              ))}
            </div>
            <button onClick={handleVerifyOtp} disabled={loading || otp.join("").length < 6} className="btn-primary w-full mb-3">
              {loading ? "Verifying..." : t("verify_otp")}
            </button>
            <button onClick={handleSendOtp} disabled={countdown > 0} className="w-full text-sm text-gray-500 py-2">
              {countdown > 0 ? `Resend in ${countdown}s` : t("resend_otp")}
            </button>
          </>
        )}
        {step === "name" && (
          <>
            <h1 className="text-2xl font-bold mb-2">{"What's your name?"}</h1>
            <p className="text-gray-500 text-sm mb-8">Tell us what to call you</p>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("enter_name")} className="input-field mb-4" onKeyDown={(e) => e.key === "Enter" && handleSaveName()} />
            <button onClick={handleSaveName} disabled={loading || !name.trim()} className="btn-primary w-full">
              {loading ? "Saving..." : t("next")}
            </button>
          </>
        )}
        {step === "role" && (
          <>
            <h1 className="text-2xl font-bold mb-2">{t("choose_role")}</h1>
            <p className="text-gray-500 text-sm mb-8">Choose how you want to use LocalServices</p>
            <div className="space-y-4">
              <button onClick={() => handleRoleSelect("CUSTOMER")} disabled={loading} className="w-full p-5 border-2 border-gray-200 rounded-3xl text-left hover:border-blue-400 hover:bg-blue-50 transition-all group">
                <div className="text-3xl mb-2">🛒</div>
                <div className="font-bold text-gray-900 group-hover:text-blue-700">{t("i_want_to_hire")}</div>
                <div className="text-sm text-gray-500 mt-1">Find and hire local service providers</div>
              </button>
              <button onClick={() => handleRoleSelect("PROVIDER")} disabled={loading} className="w-full p-5 border-2 border-gray-200 rounded-3xl text-left hover:border-blue-400 hover:bg-blue-50 transition-all group">
                <div className="text-3xl mb-2">💼</div>
                <div className="font-bold text-gray-900 group-hover:text-blue-700">{t("i_want_to_provide")}</div>
                <div className="text-sm text-gray-500 mt-1">List your services and grow your business</div>
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function RegisterPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterPage />
    </Suspense>
  );
}