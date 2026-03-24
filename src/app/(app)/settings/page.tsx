"use client";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTheme } from "@/lib/theme";

export default function SettingsPage() {
  const { t } = useLanguage();
  const { logout } = useAuthStore();
  const router = useRouter();
  const { isDark } = useTheme();
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav showBack onBack={() => router.back()} title={t("settings")} />
      <div className="p-4 space-y-4">
        <div className="card p-4"><h3 className="font-bold mb-4">Preferences</h3><div className="flex items-center justify-between"><div><p className="font-medium text-sm">Language</p><p className="text-xs text-gray-500">Choose your preferred language</p></div><LanguageSwitcher /></div></div>
        <div className="card p-4"><h3 className="font-bold mb-4">Account</h3><button onClick={() => router.push("/profile")} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50"><span className="text-sm font-medium">👤 Edit Profile</span><span>›</span></button></div>
        <button onClick={() => { logout(); router.replace("/"); }} className="w-full p-4 bg-red-50 text-red-600 rounded-2xl font-semibold border border-red-100">🚪 {t("logout")}</button>
      </div>
    </div>
  );
}
<div className="card p-4">
  <h3 className="font-bold text-gray-900 dark:text-white mb-4">Appearance</h3>
  <div className="flex items-center justify-between">
    <div>
      <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">Theme</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Light, dark or system default</p>
    </div>
    <ThemeToggle />
  </div>
</div>
