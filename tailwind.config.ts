/** @type {import("tailwindcss").Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["DM Serif Display", "system-ui", "serif"],
      },
      colors: {
            brand: {
              50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe",
              400: "#c084fc", 500: "#a855f7", 600: "#9333ea", 700: "#7c3aed",
              800: "#6d28d9", 900: "#5b21b6", 950: "#3b0764",
            },
            accent: {
              50: "#fdf2f8", 100: "#fce7f3", 200: "#fbcfe8", 300: "#f9a8d4",
              400: "#f472b6", 500: "#ec4899", 600: "#db2777", 700: "#be185d",
            },
          },
        dark: {
          bg: "#0a0f1e",
          surface: "#0f1629",
          card: "#131d35",
          border: "rgba(255,255,255,0.06)",
          text: "#f1f5f9",
          muted: "#94a3b8",
        },
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)",
        card: "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.08)",
        elevated: "0 8px 30px rgba(0,0,0,0.12)",
        brand: "0 4px 14px rgba(12,142,232,0.35)",
        glass: "0 8px 32px rgba(31,38,135,0.08)",
        "glass-dark": "0 8px 32px rgba(0,0,0,0.3)",
        "glass-hover": "0 12px 40px rgba(31,38,135,0.15)",
      },
      backdropBlur: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "40px",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        shimmer: "shimmer 1.8s infinite",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "bounce-slow": "bounce 2s infinite",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #2563eb, #4f46e5)",
        "gradient-brand-soft": "linear-gradient(135deg, #eff6ff, #eef2ff)",
        "gradient-dark": "linear-gradient(135deg, #0a0f1e 0%, #0f1629 100%)",
        "gradient-mesh": "radial-gradient(at 20% 0%, rgba(37,99,235,0.06) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(99,102,241,0.05) 0px, transparent 50%)",
        "gradient-mesh-dark": "radial-gradient(at 20% 0%, rgba(37,99,235,0.15) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(99,102,241,0.1) 0px, transparent 50%)",
        "glass-card": "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))",
        "glass-card-dark": "linear-gradient(135deg, rgba(15,23,42,0.8), rgba(15,23,42,0.6))",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-top": "env(safe-area-inset-top)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};