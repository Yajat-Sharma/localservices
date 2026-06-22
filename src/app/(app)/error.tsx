"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--bg, #f8fafc)" }}
    >
      <div className="text-center max-w-sm animate-fade-in">
        {/* Icon */}
        <div
          className="mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.06))",
            border: "1px solid rgba(124,58,237,0.12)",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7c3aed"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h2
          className="text-xl font-bold mb-2"
          style={{ color: "var(--text-primary, #1a1a2e)" }}
        >
          Oops! Something broke
        </h2>

        <p
          className="text-sm mb-6 leading-relaxed"
          style={{ color: "var(--text-secondary, #64748b)" }}
        >
          This page ran into an issue. Try refreshing or head back.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              boxShadow: "0 4px 14px rgba(124,58,237,0.25)",
            }}
          >
            Retry
          </button>

          <button
            onClick={() => window.history.back()}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
            style={{
              color: "var(--text-primary, #1a1a2e)",
              background: "var(--bg-subtle, #f1f5f9)",
              border: "1px solid var(--border, #e2e8f0)",
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
