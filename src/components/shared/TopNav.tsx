"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { Sidebar } from "./Sidebar";
import axios from "axios";

interface TopNavProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showSearch?: boolean;
  searchValue?: string;
  onSearch?: (v: string) => void;
  rightElement?: React.ReactNode;
}

export function TopNav({ title, showBack, onBack, showSearch, searchValue, onSearch, rightElement }: TopNavProps) {
  const { t } = useLanguage();
  const { user, setUser, setToken } = useAuthStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <header className="sticky top-0 z-30 glass-nav">
        <div className="flex items-center gap-3 px-4 py-3.5 min-h-[60px]">

          {/* Left */}
          {showBack ? (
            <button
              onClick={onBack || (() => router.back())}
              className="w-9 h-9 flex items-center justify-center rounded-2xl transition-all hover:scale-105 active:scale-95 flex-shrink-0"
              style={{ background: "rgba(124,58,237,0.08)", color: "var(--primary)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-2xl transition-all hover:scale-105 flex-shrink-0"
              style={{ background: "rgba(124,58,237,0.08)", color: "var(--primary)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="15" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          )}

          {/* Center */}
          {showSearch ? (
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--text-muted)" }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={searchValue}
                onChange={e => onSearch?.(e.target.value)}
                placeholder={t("search_services")}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm font-medium transition-all"
                style={{
                  background: "rgba(124,58,237,0.06)",
                  border: "1.5px solid rgba(124,58,237,0.1)",
                  color: "var(--text-input)",
                  outline: "none",
                }}
                onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(124,58,237,0.1)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          ) : (
            <div className="flex-1">
              {title && (
                <h1 className="font-black text-lg tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  {title}
                </h1>
              )}
            </div>
          )}

          {/* Right */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Admin back button */}
            {user?.originalRole === "ADMIN" && user?.role !== "ADMIN" && (
              <button
                onClick={async () => {
                  const token = localStorage.getItem("auth_token");
                  try {
                    const res = await axios.post("/api/users/switch-role", { role: "ADMIN" }, { headers: { Authorization: `Bearer ${token}` } });
                    localStorage.setItem("auth_token", res.data.token);
                    document.cookie = `auth_token=${res.data.token}; path=/; max-age=${30*24*60*60}`;
                    setToken(res.data.token);
                    setUser(res.data.user);
                    router.replace("/admin");
                  } catch {}
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                Admin
              </button>
            )}
            {rightElement || (
              <>
                <NotificationBell />
                <LanguageSwitcher />
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}