import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "linear-gradient(135deg, #0a0f1e 0%, #1a1145 50%, #0f1629 100%)",
      }}
    >
      <div className="text-center max-w-md animate-fade-in">
        {/* Large 404 text */}
        <div className="relative mb-6">
          <h1
            className="text-[120px] font-black leading-none tracking-tight select-none"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.15))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            404
          </h1>
          <div
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center animate-float"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.08))",
                border: "1px solid rgba(124,58,237,0.15)",
                backdropFilter: "blur(8px)",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
          </div>
        </div>

        <h2
          className="text-xl font-bold mb-3"
          style={{
            background: "linear-gradient(135deg, #e2e8f0, #ffffff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Page not found
        </h2>

        <p className="text-sm leading-relaxed mb-8" style={{ color: "#94a3b8" }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 inline-block"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
            }}
          >
            Back to Home
          </Link>

          <Link
            href="/hire"
            className="px-6 py-3 rounded-2xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 inline-block"
            style={{
              color: "#e2e8f0",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            Find Services
          </Link>
        </div>
      </div>
    </div>
  );
}
