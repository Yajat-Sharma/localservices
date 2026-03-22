"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";

export default function HomePage() {
  const { t } = useLanguage();
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "ADMIN") router.replace("/admin");
      else if (user.role === "PROVIDER") router.replace("/provide/dashboard");
      else router.replace("/hire");
    }
  }, [user, isLoading, router]);
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (user) return null;
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">LS</div>
          <span className="font-bold text-gray-900">{t("app_name")}</span>
        </div>
        <LanguageSwitcher compact/>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
        <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center mb-8">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-5xl">🏘️</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">{t("tagline")}</h1>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-8">Connect with verified plumbers, electricians, tutors, tailors and more — just minutes away.</p>
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {["🔧 Plumber","⚡ Electrician","🧵 Tailor","📚 Tutor","🍱 Tiffin","🎨 Projects"].map((cat) => (
            <span key={cat} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600 font-medium">{cat}</span>
          ))}
        </div>
        <div className="w-full max-w-xs space-y-3">
          <Link href="/login" className="btn-primary w-full flex items-center justify-center text-base">{t("login")}</Link>
          <Link href="/register" className="btn-secondary w-full flex items-center justify-center text-base">{t("signup")}</Link>
        </div>
        <p className="text-xs text-gray-400 mt-8">First 50 businesses register <span className="text-blue-500 font-semibold">FREE</span></p>
      </main>
    </div>
  );
}
