"use client";
import { useLanguage } from "@/i18n/LanguageContext";
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useLanguage();
  return (
    <div className={`inline-flex bg-gray-100 rounded-xl p-1 ${className}`}>
      <button onClick={() => setLanguage("en")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${language === "en" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>EN</button>
      <button onClick={() => setLanguage("hi")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${language === "hi" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>हिं</button>
    </div>
  );
}
