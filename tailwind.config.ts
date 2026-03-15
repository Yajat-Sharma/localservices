/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-syne)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f0f7ff", 100: "#e0effe", 200: "#bae0fd", 300: "#7cc8fc",
          400: "#36aaf7", 500: "#0c8ee8", 600: "#006fc6", 700: "#0059a0",
          800: "#064c84", 900: "#0b406e", 950: "#072949",
        },
        surface: {
          DEFAULT: "#ffffff", 50: "#fafafa", 100: "#f5f5f5",
          200: "#e5e5e5", 300: "#d4d4d4",
        },
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)",
        card: "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.08)",
        elevated: "0 8px 30px rgba(0,0,0,0.12)",
        brand: "0 4px 14px rgba(12,142,232,0.35)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
