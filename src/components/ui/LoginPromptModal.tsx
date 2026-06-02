"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The path to return to after login (e.g. /provider/abc123) */
  from?: string;
  /** Action the user was trying to do */
  action?: string;
}

export function LoginPromptModal({
  isOpen,
  onClose,
  from,
  action = "book this service",
}: LoginPromptModalProps) {
  const loginHref  = from ? `/login?from=${encodeURIComponent(from)}`    : "/login";
  const signupHref = from ? `/register?from=${encodeURIComponent(from)}` : "/register";

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full animate-slide-up"
        style={{
          background: "var(--bg-card)",
          borderRadius: "2rem 2rem 0 0",
          boxShadow: "0 -8px 60px rgba(124,58,237,0.2)",
          border: "1px solid var(--border)",
          borderBottom: "none",
          padding: "2rem 1.5rem 2.5rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div
          className="w-10 h-1 rounded-full mx-auto mb-6"
          style={{ background: "var(--border)" }}
        />

        {/* Icon */}
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.08))",
            border: "1px solid rgba(124,58,237,0.15)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
            <defs>
              <linearGradient id="lpm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <path stroke="url(#lpm-grad)" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle stroke="url(#lpm-grad)" cx="12" cy="7" r="4" />
          </svg>
        </div>

        {/* Headline */}
        <h2
          className="text-xl font-black text-center mb-1 tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Sign in to {action}
        </h2>
        <p className="text-sm text-center mb-6" style={{ color: "var(--text-muted)" }}>
          Create a free account to book, chat & track your services.
        </p>

        {/* Benefits */}
        <div
          className="rounded-2xl p-4 mb-6 space-y-2.5"
          style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
        >
          {[
            { icon: "📋", text: "Track all your bookings in one place" },
            { icon: "💬", text: "Chat directly with the professional" },
            { icon: "⭐", text: "Leave reviews after the job is done" },
            { icon: "🔔", text: "Get real-time status notifications" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <span className="text-base">{item.icon}</span>
              <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Link href={loginHref} className="btn-primary text-center py-4 text-base">
            Sign In
          </Link>
          <Link
            href={signupHref}
            className="btn-secondary text-center py-4 text-base"
          >
            Create Free Account
          </Link>
          <button
            onClick={onClose}
            className="text-sm font-semibold py-2"
            style={{ color: "var(--text-muted)" }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
