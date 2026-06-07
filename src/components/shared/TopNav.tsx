"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthStore } from "@/lib/store";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { Sidebar } from "./Sidebar";
import axios from "axios";

interface TopNavProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showSearch?: boolean;
  searchValue?: string;
  onSearch?: (v: string) => void;
  rightElement?: React.ReactNode;
}

export function TopNav({ title, subtitle, showBack, onBack, showSearch, searchValue, onSearch, rightElement }: TopNavProps) {
  const { t } = useLanguage();
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("recent_searches");
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse recent searches", e);
        }
      }
    }
  }, []);

  const saveSearchTerm = (term: string) => {
    const query = term.trim();
    if (!query) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, 5);
      if (typeof window !== "undefined") {
        localStorage.setItem("recent_searches", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const deleteSearchTerm = (term: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(item => item !== term);
      if (typeof window !== "undefined") {
        localStorage.setItem("recent_searches", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const clearAllHistory = () => {
    setRecentSearches([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("recent_searches");
    }
  };

  // Debounced auto-save
  useEffect(() => {
    if (!searchValue || searchValue.trim() === "") return;
    const handler = setTimeout(() => {
      saveSearchTerm(searchValue);
    }, 1500);
    return () => clearTimeout(handler);
  }, [searchValue]);

  const filteredSearches = recentSearches.filter(term =>
    term.toLowerCase().includes((searchValue || "").toLowerCase())
  );

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
                onFocus={e => {
                  e.target.style.borderColor = "var(--primary)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)";
                  setIsFocused(true);
                }}
                onBlur={e => {
                  e.target.style.borderColor = "rgba(124,58,237,0.1)";
                  e.target.style.boxShadow = "none";
                  setIsFocused(false);
                }}
                onKeyDown={e => {
                  if (e.key === "Escape") {
                    (e.target as HTMLInputElement).blur();
                  } else if (e.key === "Enter" && searchValue && searchValue.trim() !== "") {
                    saveSearchTerm(searchValue);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
              />
              {isFocused && filteredSearches.length > 0 && (
                <div
                  className="absolute left-0 right-0 mt-2 p-3.5 rounded-2xl shadow-lg border animate-scale-in z-50"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border)",
                    boxShadow: "var(--shadow-lg)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-purple-300">
                      Recent Searches
                    </span>
                    <button
                      onMouseDown={e => e.preventDefault()}
                      onClick={clearAllHistory}
                      className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-1">
                    {filteredSearches.map((term, index) => (
                      <div
                        key={term + index}
                        className="flex items-center justify-between group rounded-xl px-2.5 py-2 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all cursor-pointer"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          onSearch?.(term);
                          saveSearchTerm(term);
                          if (document.activeElement instanceof HTMLElement) {
                            document.activeElement.blur();
                          }
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <svg
                            className="text-gray-400 group-hover:text-purple-500 transition-colors"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                            {term}
                          </span>
                        </div>
                        <button
                          onMouseDown={e => e.preventDefault()}
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid triggering search
                            deleteSearchTerm(term);
                          }}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                          title="Remove search"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1">
              {title && (
                <h1 className="font-black text-lg tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-[10px] font-bold tracking-wide uppercase mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Right */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Admin back button */}
            {user?.originalRole === "ADMIN" && user?.role !== "ADMIN" && (
              <button
                onClick={async () => {
                  try {
                    const res = await axios.post("/api/users/switch-role", { role: "ADMIN" });
                    const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
                    document.cookie = `auth_token=${res.data.token}; path=/; max-age=${30*24*60*60}; SameSite=Lax${secureFlag}`;
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