"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "linear-gradient(135deg, #0a0f1e 0%, #1a1145 50%, #0f1629 100%)",
      }}
    >
      <div className="text-center max-w-md animate-fade-in">
        {/* Animated icon */}
        <div className="relative mx-auto w-24 h-24 mb-8">
          <div
            className="absolute inset-0 rounded-full animate-ping-slow opacity-20"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
          />
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.1))",
              border: "1px solid rgba(124,58,237,0.2)",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="url(#errorGrad)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <defs>
                <linearGradient id="errorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        </div>

        <h1
          className="text-2xl font-bold mb-3"
          style={{
            background: "linear-gradient(135deg, #e2e8f0, #ffffff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Something went wrong
        </h1>

        <p className="text-sm leading-relaxed mb-8" style={{ color: "#94a3b8" }}>
          We hit an unexpected error. Don&apos;t worry — your data is safe.
          Try again or go back to the home page.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
            }}
          >
            Try Again
          </button>

          <Link
            href="/"
            className="px-6 py-3 rounded-2xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
            style={{
              color: "#e2e8f0",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            Go Home
          </Link>
        </div>

        {/* Error details (collapsed by default) */}
        {error?.digest && (
          <p className="mt-8 text-xs" style={{ color: "#475569" }}>
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
