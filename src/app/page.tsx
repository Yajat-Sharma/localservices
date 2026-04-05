"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useLanguage } from "@/i18n/LanguageContext";

const SERVICES = [
  { icon: "⚡", name: "Electrician",  nameHi: "इलेक्ट्रीशियन", color: "#fbbf24", bg: "#fffbeb" },
  { icon: "🔧", name: "Plumber",      nameHi: "प्लम्बर",        color: "#60a5fa", bg: "#eff6ff" },
  { icon: "🧹", name: "Cleaning",     nameHi: "सफाई",           color: "#34d399", bg: "#ecfdf5" },
  { icon: "🎨", name: "Painter",      nameHi: "पेंटर",          color: "#f472b6", bg: "#fdf2f8" },
  { icon: "❄️", name: "AC Repair",    nameHi: "AC रिपेयर",      color: "#818cf8", bg: "#eef2ff" },
  { icon: "🔒", name: "Locksmith",    nameHi: "ताला साज़",       color: "#fb923c", bg: "#fff7ed" },
  { icon: "📺", name: "TV Repair",    nameHi: "TV रिपेयर",      color: "#a78bfa", bg: "#f5f3ff" },
  { icon: "🍱", name: "Tiffin",       nameHi: "टिफिन",          color: "#4ade80", bg: "#f0fdf4" },
];

const STEPS = [
  { number: "01", title: "Describe Your Need", desc: "Tell us what service you need and your location. It takes 30 seconds.", icon: "🎯" },
  { number: "02", title: "Get Matched", desc: "We instantly show you verified professionals near you with ratings.", icon: "✨" },
  { number: "03", title: "Book & Relax", desc: "Book in one tap. Track progress and pay after the job is done.", icon: "🚀" },
];

const FEATURES = [
  { icon: "🛡️", title: "100% Verified",      desc: "Every professional is ID-verified and background checked" },
  { icon: "⭐", title: "Rated & Reviewed",   desc: "Real reviews from real customers you can trust" },
  { icon: "📍", title: "Hyperlocal",          desc: "Professionals within 5km radius — arrive in minutes" },
  { icon: "💬", title: "In-app Chat",         desc: "Communicate directly without sharing phone numbers" },
  { icon: "🔔", title: "Live Updates",        desc: "Real-time notifications at every step of your booking" },
  { icon: "💳", title: "Transparent Pricing", desc: "No hidden charges. Know the price before you book" },
];

const TESTIMONIALS = [
  { name: "Priya Sharma", city: "Mumbai", rating: 5, text: "Found an electrician in 3 minutes! Super fast, verified, and professional. Best app for home services.", avatar: "PS" },
  { name: "Rahul Mehta",  city: "Pune",   rating: 5, text: "The plumber arrived within 30 mins. Transparent pricing and excellent work. Highly recommended!", avatar: "RM" },
  { name: "Sneha Patil",  city: "Panvel", rating: 5, text: "I use LocalServices every month for cleaning. Always reliable, always professional. 10/10!", avatar: "SP" },
];

export default function LandingPage() {
  const { language } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text-primary)" }}>

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass-nav" : ""}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", boxShadow: "0 4px 12px rgba(124,58,237,0.4)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span className="font-black text-xl tracking-tight" style={{ color: "var(--text-primary)" }}>
              Local<span className="gradient-text">Services</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher compact />
            <Link href="/login"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ color: "var(--primary)", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2.5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">

        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #a855f7, transparent)" }} />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15 blur-3xl"
            style={{ background: "radial-gradient(circle, #ec4899, transparent)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
            style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
        </div>

        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(#7c3aed 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative max-w-4xl mx-auto px-6 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8 animate-fade-in"
            style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "#7c3aed" }}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            500+ Verified Professionals Near You
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6 animate-fade-in delay-100">
            Your Home,
            <br />
            <span className="gradient-text">Perfectly</span>
            <br />
            Maintained
          </h1>

          <p className="text-xl leading-relaxed mb-10 max-w-2xl mx-auto animate-fade-in delay-200"
            style={{ color: "var(--text-secondary)" }}>
            Book trusted electricians, plumbers, cleaners and 12 more services — all verified, all nearby, all at transparent prices.
          </p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-10 animate-fade-in delay-300">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="What service do you need?"
                className="input-field pl-11 py-4"
                style={{ borderRadius: "16px" }}
                onKeyDown={e => { if (e.key === "Enter") window.location.href = "/register"; }}
              />
            </div>
            <Link href="/register" className="btn-primary px-8 py-4 whitespace-nowrap">
              Find Now
            </Link>
          </div>

          {/* Popular services */}
          <div className="flex flex-wrap items-center justify-center gap-2 animate-fade-in delay-400">
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Popular:</span>
            {SERVICES.slice(0, 5).map(s => (
              <Link key={s.name} href="/register"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105"
                style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}30` }}>
                <span>{s.icon}</span>
                {language === "hi" ? s.nameHi : s.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services Grid ── */}
      <section className="py-24 px-6" style={{ background: "var(--bg-subtle)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-widest gradient-text mb-3">Our Services</p>
            <h2 className="font-display text-4xl font-black tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
              Everything Your Home Needs
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              12 categories of verified local professionals, available 7 days a week.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SERVICES.map((service, i) => (
              <Link key={service.name} href="/register"
                className="group card p-5 text-center cursor-pointer"
                style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl transition-transform group-hover:scale-110"
                  style={{ background: service.bg }}>
                  {service.icon}
                </div>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  {language === "hi" ? service.nameHi : service.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-widest gradient-text mb-3">How It Works</p>
            <h2 className="font-display text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Booked in 60 Seconds
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative text-center group">
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-[calc(50%+40px)] right-[-calc(50%-40px)] h-px"
                    style={{ background: "linear-gradient(90deg, #7c3aed, #ec4899)", opacity: 0.3 }} />
                )}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 transition-transform group-hover:scale-110 group-hover:-rotate-3"
                  style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1))", border: "1px solid rgba(124,58,237,0.2)" }}>
                  {step.icon}
                </div>
                <p className="font-display text-5xl font-black mb-2 gradient-text opacity-20">{step.number}</p>
                <h3 className="font-bold text-lg mb-2" style={{ color: "var(--text-primary)" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6" style={{ background: "var(--bg-subtle)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-widest gradient-text mb-3">Why LocalServices</p>
            <h2 className="font-display text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Built for Trust & Speed
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="card p-5 group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110"
                  style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.08))" }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-base mb-1.5" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-widest gradient-text mb-3">Testimonials</p>
            <h2 className="font-display text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Loved by Thousands
            </h2>
          </div>

          {/* Testimonial card */}
          <div className="card p-8 text-center mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1"
              style={{ background: "linear-gradient(90deg, #7c3aed, #ec4899)" }} />
            <div className="flex justify-center mb-4">
              {"⭐".repeat(TESTIMONIALS[activeTestimonial].rating)}
            </div>
            <p className="text-lg leading-relaxed mb-6 font-medium" style={{ color: "var(--text-primary)" }}>
              "{TESTIMONIALS[activeTestimonial].text}"
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
                {TESTIMONIALS[activeTestimonial].avatar}
              </div>
              <div className="text-left">
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  {TESTIMONIALS[activeTestimonial].name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {TESTIMONIALS[activeTestimonial].city}
                </p>
              </div>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ background: i === activeTestimonial ? "#7c3aed" : "rgba(124,58,237,0.2)", width: i === activeTestimonial ? "24px" : "8px" }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-6"
        style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center text-white">
          {[
            { value: "500+", label: "Professionals" },
            { value: "2,000+", label: "Bookings Done" },
            { value: "4.9★", label: "Avg Rating" },
            { value: "15+", label: "Cities" },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-4xl font-black mb-1">{stat.value}</p>
              <p className="text-sm opacity-80 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card p-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5"
              style={{ backgroundImage: "radial-gradient(#7c3aed 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
            <div className="relative">
              <p className="text-sm font-bold uppercase tracking-widest gradient-text mb-3">Get Started Today</p>
              <h2 className="font-display text-4xl font-black tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
                Your First Booking<br />Takes 60 Seconds
              </h2>
              <p className="mb-8 text-lg" style={{ color: "var(--text-secondary)" }}>
                Join thousands of happy customers across Maharashtra.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register" className="btn-primary px-8 py-4 text-base">
                  Create Free Account
                </Link>
                <Link href="/login"
                  className="btn-secondary px-8 py-4 text-base">
                  Sign In
                </Link>
              </div>
              <p className="mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
                No credit card required • Free to use • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
            </div>
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>LocalServices</span>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            © 2026 LocalServices • Made with ❤️ in India
          </p>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}