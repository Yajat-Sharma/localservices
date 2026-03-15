"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Language, TranslationKey } from "./translations";
interface LanguageContextType { language: Language; setLanguage: (lang: Language) => void; t: (key: TranslationKey) => string; }
const LanguageContext = createContext<LanguageContextType>({ language: "en", setLanguage: () => {}, t: (key) => key });
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  useEffect(() => { const saved = localStorage.getItem("language") as Language; if (saved === "en" || saved === "hi") setLanguageState(saved); }, []);
  const setLanguage = (lang: Language) => { setLanguageState(lang); localStorage.setItem("language", lang); };
  const t = (key: TranslationKey): string => translations[language][key] || translations.en[key] || key;
  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
