"use client";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTheme } from "@/lib/theme";
import { PushNotificationToggle } from "@/components/ui/PushNotificationToggle";

export default function SettingsPage() {
  const { t } = useLanguage();
  const { logout } = useAuthStore();
  const router = useRouter();
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <TopNav showBack onBack={() => router.back()} title={t("settings")} />
      <div className="p-4 space-y-4 pb-8 animate-fade-in">

        {/* Appearance */}
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
        {/* Notifications */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">Notifications</h3>
          <PushNotificationToggle />
        </div>
        {/* SMS Notifications */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">Notifications</h3>
          <div className="space-y-3">
            <PushNotificationToggle />
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-2xl">
              <div>
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">SMS Notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Get SMS alerts for booking updates
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-full">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="text-xs font-semibold">Active</span>
              </div>
            </div>
          </div>
        </div>
        {/* Language */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Language</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">App Language</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Choose your preferred language</p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Account */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">Account</h3>
          <div className="space-y-1">
            <button
              onClick={() => router.push("/profile")}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Edit Profile</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>

            <button
              onClick={() => router.push("/forgot-password")}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Change Password</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>

            <button
              onClick={() => router.push("/bookings")}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">My Bookings</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* About */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">About</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">App Version</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">1.0.0</span>
            </div>
            <div className="flex justify-between items-center p-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Made with</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">❤️ in India</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); router.replace("/"); }}
          className="w-full p-4 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all"
          style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.15)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {t("logout")}
        </button>
      </div>
    </div>
  );
}