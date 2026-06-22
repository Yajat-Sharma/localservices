export default function AppLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg, #f8fafc)" }}
    >
      <div className="text-center animate-fade-in">
        {/* Animated spinner */}
        <div className="relative mx-auto w-12 h-12 mb-5">
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              background: "conic-gradient(from 0deg, transparent, #7c3aed, transparent)",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
              WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
            }}
          />
          <div
            className="absolute inset-1 rounded-full"
            style={{
              background: "var(--bg, #f8fafc)",
            }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              }}
            />
          </div>
        </div>

        <p
          className="text-sm font-medium"
          style={{ color: "var(--text-muted, #94a3b8)" }}
        >
          Loading…
        </p>
      </div>
    </div>
  );
}
