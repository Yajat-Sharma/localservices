"use client";
import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Language } from "@/i18n/translations";

const allLanguages: { code: Language; label: string; nativeLabel: string; flag: string }[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "hi", label: "Hindi", nativeLabel: "हिंदी", flag: "🇮🇳" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी", flag: "🇮🇳" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી", flag: "🇮🇳" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", flag: "🇮🇳" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు", flag: "🇮🇳" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা", flag: "🇧🇩" },
];

const compactLanguages = allLanguages.slice(0, 3); // EN, HI, MR only

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean; // compact = show only EN, HI, MR as pills
}

export function LanguageSwitcher({ className = "", compact = false }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const current = allLanguages.find(l => l.code === language) || allLanguages[0];

  // Compact mode — 3 pill buttons (for login/register page)
  if (compact) {
    return (
      <div className={`inline-flex bg-gray-100 rounded-xl p-1 gap-0.5 ${className}`}>
        {compactLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              language === lang.code
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {lang.nativeLabel}
          </button>
        ))}
      </div>
    );
  }

  // Full dropdown mode — all 7 languages (for settings page)
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
      >
        <span>{current.flag}</span>
        <span className="text-gray-700">{current.nativeLabel}</span>
        <span className="text-gray-400 text-xs">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-10 bg-white rounded-2xl shadow-elevated border border-gray-100 z-50 overflow-hidden min-w-44 animate-slide-up">
            {allLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { setLanguage(lang.code); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                  language === lang.code ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <div className="text-left">
                  <div className="font-medium">{lang.nativeLabel}</div>
                  <div className="text-xs text-gray-400">{lang.label}</div>
                </div>
                {language === lang.code && <span className="ml-auto text-blue-500">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}