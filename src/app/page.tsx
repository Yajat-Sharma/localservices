"use client";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";

const services = [
  { icon: "⚡", name: "Electrician" },
  { icon: "🔧", name: "Plumber" },
  { icon: "🧹", name: "Cleaning" },
  { icon: "🎨", name: "Painter" },
  { icon: "❄️", name: "AC Repair" },
  { icon: "🔒", name: "Locksmith" },
];

export default function LandingPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #faf5ff 0%, #fdf2f8 50%, #faf5ff 100%)" }}>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: "#0f0a1e" }}>LocalServices</span>
        </div>
        <LanguageSwitcher compact />
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col px-6 pt-8 pb-12">

        {/* Floating service icons */}
        <div className="relative h-48 mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl animate-float"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", boxShadow: "0 20px 60px rgba(124,58,237,0.4)" }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
          </div>

          {/* Orbiting service bubbles */}
          {services.map((s, i) => {
            const angle = (i / services.length) * 2 * Math.PI - Math.PI / 2;
            const radius = 88;
            const x = 50 + (radius / 1.9) * Math.cos(angle);
            const y = 50 + (radius / 2.4) * Math.sin(angle);
            return (
              <div
                key={s.name}
                className="absolute w-12 h-12 rounded-2xl flex flex-col items-center justify-center shadow-md"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                  background: "white",
                  border: "1px solid rgba(124,58,237,0.1)",
                  animationDelay: `${i * 0.2}s`,
                }}
              >
                <span className="text-xl">{s.icon}</span>
              </div>
            );
          })}
        </div>

        {/* Text */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black leading-tight mb-4 tracking-tight" style={{ color: "#0f0a1e" }}>
            Find Trusted
            <span className="block gradient-text">Local Services</span>
            Near You
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "#6b7280" }}>
            Connect with verified electricians, plumbers, cleaners and more — just minutes away.
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mb-10">
          {[
            { value: "500+", label: "Providers" },
            { value: "50+", label: "Free slots" },
            { value: "4.8★", label: "Rating" },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-black gradient-text">{stat.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 max-w-xs mx-auto w-full">
          <Link href="/login" className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Sign In
          </Link>
          <Link href="/register"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all hover:shadow-md"
            style={{ border: "2px solid rgba(124,58,237,0.3)", color: "#7c3aed", background: "rgba(124,58,237,0.04)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            Create Account
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mt-10">
          {[
            { icon: "🔒", text: "Secure" },
            { icon: "✅", text: "Verified" },
            { icon: "⚡", text: "Fast" },
          ].map(b => (
            <div key={b.text} className="flex items-center gap-1.5">
              <span className="text-base">{b.icon}</span>
              <span className="text-xs font-semibold" style={{ color: "#9ca3af" }}>{b.text}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}