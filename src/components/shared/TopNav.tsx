"use client";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { NotificationBell } from "@/components/ui/NotificationBell";

interface TopNavProps { title?: string; showSearch?: boolean; onSearch?: (query: string) => void; searchValue?: string; showBack?: boolean; onBack?: () => void; rightElement?: React.ReactNode; }
export function TopNav({ title, showSearch, onSearch, searchValue = "", showBack, onBack, rightElement }: TopNavProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <header className="sticky top-0 z-30 glass-nav">
        <div className="flex items-center gap-3 px-4 h-16">
          {showBack ? (
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 transition-colors text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="15" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            </button>
          )}
          {showSearch ? (
            <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
              <input type="text" value={searchValue} onChange={(e) => onSearch?.(e.target.value)} placeholder="Search services..." className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" />
            </div>
          ) : (
            <h1 className="flex-1 font-bold text-lg text-gray-900">{title}</h1>
          )}
          {rightElement || (
              <div className="flex items-center gap-1">
                <NotificationBell />
                <LanguageSwitcher />
              </div>
            )}
        </div>
      </header>
    </>
  );
}
