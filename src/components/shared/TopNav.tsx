"use client";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
interface TopNavProps { title?: string; showSearch?: boolean; onSearch?: (query: string) => void; searchValue?: string; showBack?: boolean; onBack?: () => void; rightElement?: React.ReactNode; }
export function TopNav({ title, showSearch, onSearch, searchValue = "", showBack, onBack, rightElement }: TopNavProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 h-16">
          {showBack ? (
            <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 transition-colors text-gray-600">←</button>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 transition-colors">
              <div className="space-y-1.5"><span className="block w-5 h-0.5 bg-gray-700 rounded-full" /><span className="block w-4 h-0.5 bg-gray-700 rounded-full" /><span className="block w-5 h-0.5 bg-gray-700 rounded-full" /></div>
            </button>
          )}
          {showSearch ? (
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input type="text" value={searchValue} onChange={(e) => onSearch?.(e.target.value)} placeholder="Search services..." className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" />
            </div>
          ) : (
            <h1 className="flex-1 font-bold text-lg text-gray-900">{title}</h1>
          )}
          {rightElement || <LanguageSwitcher />}
        </div>
      </header>
    </>
  );
}
